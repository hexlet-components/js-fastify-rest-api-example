import { test } from "vitest";
import * as assert from "node:assert";
import { build, getAuthHeader } from "../../helper.ts";

// Операции, у которых в main.tsp стоит @useAuth(BearerAuth). Список повторяет
// спеку намеренно: тест должен падать, если авторизацию отвяжут от неё и
// снова начнут писать jwtVerify в обработчиках руками.
//
// Тела валидные: glue вешает проверку безопасности на preHandler, то есть
// после валидации запроса, и на кривом теле без токена придёт 400, а не 401.
const protectedOperations = [
  { method: "get", url: "/users" },
  { method: "get", url: "/users/1" },
  { method: "put", url: "/users/1", body: { fullName: "Someone Else" } },
  { method: "delete", url: "/users/1" },
  { method: "post", url: "/courses", body: { name: "Course", description: "Text" } },
  { method: "put", url: "/courses/1", body: { name: "Renamed" } },
  { method: "delete", url: "/courses/1" },
  { method: "post", url: "/courses/1/lessons", body: { name: "Lesson", body: "Text" } },
] as const;

const publicOperations = [
  { method: "get", url: "/courses" },
  { method: "get", url: "/courses/1" },
  { method: "get", url: "/courses/1/lessons" },
] as const;

// Тесты собирают все расхождения в массив и сверяют его целиком, а не падают
// на первом: иначе одна открытая операция маскирует остальные.
test("protected operations reject requests without a token", async () => {
  const app = await build();

  const failures: string[] = [];
  for (const { method, url, ...rest } of protectedOperations) {
    const res = await app.inject({ method, url, ...rest });
    if (res.statusCode !== 401)
      failures.push(`${method.toUpperCase()} ${url} -> ${res.statusCode}`);
  }
  assert.deepStrictEqual(failures, []);
});

test("protected operations reject a malformed token", async () => {
  const app = await build();

  const failures: string[] = [];
  for (const { method, url, ...rest } of protectedOperations) {
    const res = await app.inject({
      method,
      url,
      headers: { Authorization: "Bearer not-a-jwt" },
      ...rest,
    });
    if (res.statusCode !== 401)
      failures.push(`${method.toUpperCase()} ${url} -> ${res.statusCode}`);
  }
  assert.deepStrictEqual(failures, []);
});

test("public operations stay reachable without a token", async () => {
  const app = await build();

  const failures: string[] = [];
  for (const { method, url } of publicOperations) {
    const res = await app.inject({ method, url });
    if (res.statusCode === 401) failures.push(`${method.toUpperCase()} ${url} -> 401`);
  }
  assert.deepStrictEqual(failures, []);
});

// Токен остаётся подписанным и не истёкшим после удаления аккаунта. Раньше
// такой запрос доходил до обработчика и падал на внешнем ключе с 500.
test("a token for a deleted user no longer authenticates", async () => {
  const app = await build();
  const user = await app.db.query.users.findFirst();
  assert.ok(user);
  const authHeader = await getAuthHeader(app, user.id);

  const before = await app.inject({ url: "/users", headers: { ...authHeader } });
  assert.equal(before.statusCode, 200, before.body);

  const deleted = await app.inject({
    method: "delete",
    url: `/users/${user.id}`,
    headers: { ...authHeader },
  });
  assert.equal(deleted.statusCode, 204, deleted.body);

  const after = await app.inject({ url: "/users", headers: { ...authHeader } });
  assert.equal(after.statusCode, 401, after.body);
});

test("protected operations accept a valid token", async () => {
  const app = await build();
  const authHeader = await getAuthHeader(app);

  const res = await app.inject({ url: "/users", headers: { ...authHeader } });
  assert.equal(res.statusCode, 200, res.body);
});
