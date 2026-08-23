import { test } from "vitest";
import * as assert from "node:assert";
import { buildClient, getAuthHeader, responseOf } from "../../helper.ts";
import { buildUser } from "../../../lib/data.ts";
import {
  usersCreate,
  usersDestroy,
  usersIndex,
  usersShow,
  usersUpdate,
} from "../../../types/handlers/sdk.gen.js";

test("get users", async () => {
  const { app, client } = await buildClient();

  const res = await usersIndex({ client, headers: await getAuthHeader(app) });
  assert.equal(responseOf(res).status, 200);
});

test("get users/:id", async () => {
  const { app, client } = await buildClient();

  const user = await app.db.query.users.findFirst();
  assert.ok(user);

  const res = await usersShow({
    client,
    headers: await getAuthHeader(app),
    path: { id: user.id },
  });
  assert.equal(responseOf(res).status, 200);
});

test("post users", async () => {
  const { client } = await buildClient();

  const res = await usersCreate({ client, body: buildUser() });
  assert.equal(responseOf(res).status, 201, JSON.stringify(res.error));
});

test("post users (unique email)", async () => {
  const { app, client } = await buildClient();

  const user = await app.db.query.users.findFirst();
  assert.ok(user);

  // Регистр не должен позволять завести дубль: правило uniqueness приводит
  // адрес к нижнему регистру перед проверкой.
  const res = await usersCreate({
    client,
    body: buildUser({ email: user.email.toUpperCase() }),
  });
  assert.equal(responseOf(res).status, 422);
});

test("put users/:id", async () => {
  const { app, client } = await buildClient();

  const user = await app.db.query.users.findFirst();
  assert.ok(user);

  const res = await usersUpdate({
    client,
    headers: await getAuthHeader(app),
    path: { id: user.id },
    body: { fullName: buildUser().fullName },
  });
  assert.equal(responseOf(res).status, 200, JSON.stringify(res.error));
});

test("delete users/:id", async () => {
  const { app, client } = await buildClient();

  const user = await app.db.query.users.findFirst();
  assert.ok(user);

  const res = await usersDestroy({
    client,
    headers: await getAuthHeader(app),
    path: { id: user.id },
  });
  assert.equal(responseOf(res).status, 204);
});
