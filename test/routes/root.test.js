import * as assert from "node:assert";
import { test } from "vitest";
import { build } from "../helper.ts";

test("default root route", async () => {
  const app = await build();

  const res = await app.inject({
    url: "/",
  });
  assert.deepStrictEqual(JSON.parse(res.payload), { root: true });
});
