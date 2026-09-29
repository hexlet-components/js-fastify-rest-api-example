import { expect } from "vitest";
import { build, createTest, expectStatus, getAuthHeader } from "./helper.ts";

// Всё, что не привязано к одному маршруту: старт приложения, документы, формат
// ошибок и операционные эндпоинты.

const test = createTest();

// Секрет раньше был зашит в plugins/jwt.ts строкой "supersecret". Теперь он
// приходит из проверенного схемой конфига, и смысл проверки в том, что
// приложение с плохим секретом не поднимается вовсе. Такому тесту нужен свой
// экземпляр: общий уже поднят и с нормальным секретом.
test("the app refuses to boot without a JWT secret", async () => {
  const original = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;

  try {
    await expect(build()).rejects.toThrow(/JWT_SECRET/);
  } finally {
    process.env.JWT_SECRET = original;
  }
});

test("the app refuses to boot with a too-short JWT secret", async () => {
  const original = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "short";

  try {
    await expect(build()).rejects.toThrow(/JWT_SECRET/);
  } finally {
    process.env.JWT_SECRET = original;
  }
});

test("the openapi document and reference page are served", async ({ app }) => {
  const document = await app.inject({ url: "/v1/openapi.json" });
  expectStatus(document, 200);
  expect(document.json().openapi).toMatch(/^3\./);

  // Scalar отдаёт страницу на /docs/ и уводит на неё редиректом с /docs.
  const redirect = await app.inject({ url: "/docs" });
  expectStatus(redirect, 301);

  const page = await app.inject({ url: redirect.headers.location as string });
  expectStatus(page, 200);
  expect(page.body).toMatch(/openapi\.json/);
});

test("both versions serve their own document", async ({ app }) => {
  const v1 = await app.inject({ url: "/v1/openapi.json" });
  const v2 = await app.inject({ url: "/v2/openapi.json" });
  expectStatus(v1, 200);
  expectStatus(v2, 200);

  const v1Document = v1.json();
  const v2Document = v2.json();
  expect(v1Document.components.schemas.User.properties).not.toHaveProperty("phone");
  expect(v2Document.components.schemas.User.properties).toHaveProperty("phone");

  // Без servers клиент, собранный по документу, стучался бы в корень, где
  // маршрутов нет: префикс версии живёт только в регистрации glue.
  expect(v1Document.servers).toEqual([{ url: "/v1", description: "Версия 1" }]);
  expect(v2Document.servers).toEqual([{ url: "/v2", description: "Версия 2" }]);
});

// Корень остаётся пустым: без этой проверки забытая регистрация без префикса
// прошла бы незамеченной, потому что все остальные тесты ходят по /v1.
test("the versionless root serves no resources", async ({ app }) => {
  for (const url of ["/users", "/courses", "/tokens", "/openapi.json"]) {
    expectStatus(await app.inject({ url }), 404);
  }
});

// Все модели ошибок в main.tsp наследуют ProblemDetails, значит и тело должно
// быть problem+json, а не дефолтным форматом fastify.
test("errors are rendered as RFC 9457 problem details", async ({ app }) => {
  const authHeader = await getAuthHeader(app);

  const res = await app.inject({ url: "/v1/users/999999", headers: { ...authHeader } });

  expectStatus(res, 404);
  expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
  expect(res.json()).toEqual({ status: 404, title: "Not Found", detail: "Not Found" });
});

// Postgres не хранит NUL в text-колонках, и без проверки на входе такой ввод
// доезжал до insert и уходил наружу как 500. Нашёл контрактный прогон. Хук
// общий для всех операций, поэтому и тест лежит здесь, а не у пользователей.
test("a NUL character in a text field is rejected, not stored", async ({ app }) => {
  const res = await app.inject({
    method: "post",
    url: "/v1/users",
    body: { email: "nul\u0000@hexlet.io", password: "correct-horse-battery-staple" },
  });
  expectStatus(res, 400);

  const stored = await app.db.query.users.findMany();
  expect(stored.filter((user) => user.email.includes("nul"))).toEqual([]);
});

// Без content-type у fastify нет схемы тела, и пустой запрос доезжал до
// обработчика: POST /tokens отвечал 500, остальные операции 422 от zod. Нашёл
// контрактный прогон. Проверка общая, поэтому обходятся все операции с телом.
test("a request without a body is rejected as a bad request", async ({ app }) => {
  const authHeader = await getAuthHeader(app);
  const operations = [
    ["post", "/v1/tokens"],
    ["post", "/v2/tokens"],
    ["post", "/v1/users"],
    ["post", "/v1/courses"],
  ] as const;

  for (const [method, url] of operations) {
    const res = await app.inject({ method, url, headers: { ...authHeader } });
    expectStatus(res, 400);
    expect(res.json()).toMatchObject({ status: 400, detail: "Request body is required" });
  }
});

// Ни /health, ни /metrics не было: оркестратору нечего опрашивать, а метрик по
// запросам не существовало вовсе.
test("health reports the app and its database", async ({ app }) => {
  const res = await app.inject({ url: "/health" });
  expectStatus(res, 200);
  expect(res.json()).toEqual({ status: "ok" });
});

test("metrics are exposed in prometheus format", async ({ app }) => {
  // Запрос до снятия метрик, чтобы серия по маршрутам была непустой.
  await app.inject({ url: "/v1/courses" });

  const res = await app.inject({ url: "/metrics" });
  expectStatus(res, 200);
  expect(res.headers["content-type"]).toMatch(/text\/plain/);
  expect(res.body).toMatch(/http_request_duration_seconds/);
  expect(res.body).toMatch(/process_cpu_seconds_total/);
});
