import { test } from "vitest";
import * as assert from "node:assert";
import { build, getAuthHeader } from "../../helper.ts";

const MISSING_ID = 999_999;

// ensure() вызывал httpErrors.createError, который ошибку только создаёт, но не
// бросает. Из-за этого ни один из этих запросов не отдавал 404: показ уходил с
// 200 и пустым телом, удаление — с 204.
test("operations on a missing record answer 404", async () => {
  const app = await build();
  const authHeader = await getAuthHeader(app);

  const cases = [
    { method: "get", url: `/users/${MISSING_ID}` },
    { method: "put", url: `/users/${MISSING_ID}`, body: { fullName: "Nobody At All" } },
    { method: "delete", url: `/users/${MISSING_ID}` },
    { method: "get", url: `/courses/${MISSING_ID}` },
    { method: "get", url: `/courses/1/lessons/${MISSING_ID}` },
  ] as const;

  const failures: string[] = [];
  for (const { method, url, ...rest } of cases) {
    const res = await app.inject({ method, url, headers: { ...authHeader }, ...rest });
    if (res.statusCode !== 404)
      failures.push(`${method.toUpperCase()} ${url} -> ${res.statusCode}`);
  }
  assert.deepStrictEqual(failures, []);
});

// Все модели ошибок в main.tsp наследуют ProblemDetails, значит и тело должно
// быть problem+json, а не дефолтным форматом fastify.
test("a 404 is rendered as RFC 9457 problem details", async () => {
  const app = await build();
  const authHeader = await getAuthHeader(app);

  const res = await app.inject({ url: `/users/${MISSING_ID}`, headers: { ...authHeader } });

  assert.equal(res.statusCode, 404);
  assert.match(res.headers["content-type"] as string, /application\/problem\+json/);
  assert.deepStrictEqual(JSON.parse(res.body), {
    status: 404,
    title: "Not Found",
    detail: "Not Found",
  });
});
