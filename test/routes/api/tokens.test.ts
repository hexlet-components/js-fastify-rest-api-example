import { test } from "vitest";
import * as assert from "node:assert";
import { build } from "../../helper.ts";
import { DEFAULT_PASSWORD } from "../../../lib/data.ts";

test("post tokens", async () => {
  const app = await build();

  const user = await app.db.query.users.findFirst();
  assert.ok(user);

  const res = await app.inject({
    method: "post",
    url: `/tokens`,
    body: {
      email: user.email,
      password: DEFAULT_PASSWORD,
    },
  });
  assert.equal(res.statusCode, 201, res.body);
});

test("post tokens rejects a wrong password", async () => {
  const app = await build();

  const user = await app.db.query.users.findFirst();
  assert.ok(user);

  const res = await app.inject({
    method: "post",
    url: `/tokens`,
    body: { email: user.email, password: "definitely-not-the-password" },
  });
  assert.equal(res.statusCode, 401, res.body);
});

// Неизвестный email раньше давал 500: ensure() ошибку не бросал, и обработчик
// шёл дальше читать поле у undefined.
test("post tokens rejects an unknown email", async () => {
  const app = await build();

  const res = await app.inject({
    method: "post",
    url: `/tokens`,
    body: { email: "nobody@hexlet.io", password: DEFAULT_PASSWORD },
  });
  assert.equal(res.statusCode, 401, res.body);
});

// Ответ на неизвестный email и на неверный пароль обязан совпадать, иначе по
// эндпоинту можно перебирать зарегистрированные адреса.
test("post tokens does not reveal whether an email is registered", async () => {
  const app = await build();

  const user = await app.db.query.users.findFirst();
  assert.ok(user);

  const unknown = await app.inject({
    method: "post",
    url: `/tokens`,
    body: { email: "nobody@hexlet.io", password: DEFAULT_PASSWORD },
  });
  const wrongPassword = await app.inject({
    method: "post",
    url: `/tokens`,
    body: { email: user.email, password: "definitely-not-the-password" },
  });

  assert.equal(unknown.statusCode, wrongPassword.statusCode);
  assert.deepStrictEqual(JSON.parse(unknown.body), JSON.parse(wrongPassword.body));
});
