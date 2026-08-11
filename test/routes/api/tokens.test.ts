import { test } from "vitest";
import * as assert from "node:assert";
import { build } from "../../helper.ts";

test("post tokens", async () => {
  const app = await build();

  const user = await app.db.query.users.findFirst();
  assert.ok(user);

  const res = await app.inject({
    method: "post",
    url: `/tokens`,
    body: {
      email: user.email,
      password: "",
    },
  });
  assert.equal(res.statusCode, 201, res.body);
});
