import { test } from "vitest";
import * as assert from "node:assert";
import { buildClient, responseOf } from "../../helper.ts";
import { DEFAULT_PASSWORD } from "../../../lib/data.ts";
import { tokensCreate } from "../../../types/handlers/sdk.gen.js";

test("post tokens", async () => {
  const { app, client } = await buildClient();

  const user = await app.db.query.users.findFirst();
  assert.ok(user);

  const res = await tokensCreate({
    client,
    body: { email: user.email, password: DEFAULT_PASSWORD },
  });
  assert.equal(responseOf(res).status, 201, JSON.stringify(res.error));
});

test("post tokens rejects a wrong password", async () => {
  const { app, client } = await buildClient();

  const user = await app.db.query.users.findFirst();
  assert.ok(user);

  const res = await tokensCreate({
    client,
    body: { email: user.email, password: "definitely-not-the-password" },
  });
  assert.equal(responseOf(res).status, 401);
});

// Неизвестный email раньше давал 500: ensure() ошибку не бросал, и обработчик
// шёл дальше читать поле у undefined.
test("post tokens rejects an unknown email", async () => {
  const { client } = await buildClient();

  const res = await tokensCreate({
    client,
    body: { email: "nobody@hexlet.io", password: DEFAULT_PASSWORD },
  });
  assert.equal(responseOf(res).status, 401);
});

// Ответ на неизвестный email и на неверный пароль обязан совпадать, иначе по
// эндпоинту можно перебирать зарегистрированные адреса.
test("post tokens does not reveal whether an email is registered", async () => {
  const { app, client } = await buildClient();

  const user = await app.db.query.users.findFirst();
  assert.ok(user);

  const unknown = await tokensCreate({
    client,
    body: { email: "nobody@hexlet.io", password: DEFAULT_PASSWORD },
  });
  const wrongPassword = await tokensCreate({
    client,
    body: { email: user.email, password: "definitely-not-the-password" },
  });

  assert.equal(responseOf(unknown).status, responseOf(wrongPassword).status);
  assert.deepStrictEqual(unknown.error, wrongPassword.error);
});
