import { test } from "vitest";
import * as assert from "node:assert";
import { build, getAuthHeader } from "../../helper.ts";
import { buildUser } from "../../../lib/data.ts";

// В строке users лежит passwordDigest, а схема ответа его не отсечёт: у User в
// контракте нет additionalProperties: false. Единственное, что его удерживает,
// — публичная проекция в db/projections.ts, и проверять надо каждый эндпоинт,
// который отдаёт пользователя.
test("no users endpoint leaks the password digest", async () => {
  const app = await build();
  const authHeader = await getAuthHeader(app);
  const user = await app.db.query.users.findFirst();
  assert.ok(user);

  const created = await app.inject({
    method: "post",
    url: "/users",
    body: buildUser(),
  });
  assert.equal(created.statusCode, 201, created.body);

  const responses = {
    index: await app.inject({ url: "/users", headers: { ...authHeader } }),
    show: await app.inject({ url: `/users/${user.id}`, headers: { ...authHeader } }),
    create: created,
    update: await app.inject({
      method: "put",
      url: `/users/${user.id}`,
      headers: { ...authHeader },
      body: { fullName: "Renamed Person" },
    }),
  };

  const leaking: string[] = [];
  for (const [name, res] of Object.entries(responses)) {
    assert.ok(res.statusCode < 400, `${name} -> ${res.statusCode}: ${res.body}`);
    if (/password/i.test(res.body)) leaking.push(`${name}: ${res.body}`);
  }
  assert.deepStrictEqual(leaking, []);
});

test("a created user can authenticate with the password they set", async () => {
  const app = await build();
  const attrs = buildUser();

  const created = await app.inject({ method: "post", url: "/users", body: attrs });
  assert.equal(created.statusCode, 201, created.body);

  const token = await app.inject({
    method: "post",
    url: "/tokens",
    body: { email: attrs.email, password: attrs.password },
  });
  assert.equal(token.statusCode, 201, token.body);
});

test("changing the password invalidates the old one", async () => {
  const app = await build();
  const attrs = buildUser();

  const created = await app.inject({ method: "post", url: "/users", body: attrs });
  assert.equal(created.statusCode, 201, created.body);
  const { id } = JSON.parse(created.body);

  const authHeader = await getAuthHeader(app, id);
  const updated = await app.inject({
    method: "put",
    url: `/users/${id}`,
    headers: { ...authHeader },
    body: { password: "a-brand-new-password" },
  });
  assert.equal(updated.statusCode, 200, updated.body);

  const withOld = await app.inject({
    method: "post",
    url: "/tokens",
    body: { email: attrs.email, password: attrs.password },
  });
  assert.equal(withOld.statusCode, 401, withOld.body);

  const withNew = await app.inject({
    method: "post",
    url: "/tokens",
    body: { email: attrs.email, password: "a-brand-new-password" },
  });
  assert.equal(withNew.statusCode, 201, withNew.body);
});

test("a password shorter than the contract allows is rejected", async () => {
  const app = await build();

  const res = await app.inject({
    method: "post",
    url: "/users",
    body: { ...buildUser(), password: "short" },
  });
  assert.equal(res.statusCode, 400, res.body);
});
