import { test } from "vitest";
import * as assert from "node:assert";
import { build } from "../helper.ts";

// Секрет раньше был зашит в plugins/jwt.ts строкой "supersecret". Теперь он
// приходит из проверенного схемой конфига, и смысл проверки в том, что
// приложение с плохим секретом не поднимается вовсе.
test("the app refuses to boot without a JWT secret", async () => {
  const original = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;

  try {
    await assert.rejects(build(), /JWT_SECRET/);
  } finally {
    process.env.JWT_SECRET = original;
  }
});

test("the app refuses to boot with a too-short JWT secret", async () => {
  const original = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "short";

  try {
    await assert.rejects(build(), /JWT_SECRET/);
  } finally {
    process.env.JWT_SECRET = original;
  }
});

test("the openapi document and reference page are served", async () => {
  const app = await build();

  const document = await app.inject({ url: "/openapi.json" });
  assert.equal(document.statusCode, 200, document.body);
  assert.ok(JSON.parse(document.body).openapi.startsWith("3."));

  // Scalar отдаёт страницу на /docs/ и уводит на неё редиректом с /docs.
  const redirect = await app.inject({ url: "/docs" });
  assert.equal(redirect.statusCode, 301);

  const page = await app.inject({ url: redirect.headers.location as string });
  assert.equal(page.statusCode, 200, page.body.slice(0, 200));
  assert.match(page.body, /openapi\.json/);
});

test("responses carry the security headers helmet adds", async () => {
  const app = await build();

  const res = await app.inject({ url: "/courses" });
  assert.equal(res.headers["x-content-type-options"], "nosniff");
  assert.ok(res.headers["x-frame-options"], "x-frame-options is missing");
});
