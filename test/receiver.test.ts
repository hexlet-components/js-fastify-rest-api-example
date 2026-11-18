import assert from "node:assert/strict";
import { test } from "node:test";
import { buildReceiver } from "../scripts/receiver.ts";
import { sign } from "../src/services.ts";
test("receiver validates signature and deduplicates the same event", async () => {
  let effects = 0;
  const app = await buildReceiver({
    secret: "test-secret",
    onEvent: () => {
      effects++;
    },
  });
  const event = { id: "evt-1", type: "course.published", courseId: 1 };
  const raw = JSON.stringify(event);
  const headers = {
    "content-type": "application/json",
    "x-event-id": event.id,
    "x-signature": sign(raw, "test-secret"),
  };
  try {
    assert.equal(
      (await app.inject({ method: "POST", url: "/events", headers, payload: raw })).statusCode,
      204,
    );
    assert.equal(
      (await app.inject({ method: "POST", url: "/events", headers, payload: raw })).statusCode,
      204,
    );
    assert.equal(effects, 1);
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/events",
          headers: { ...headers, "x-signature": "bad" },
          payload: raw,
        })
      ).statusCode,
      401,
    );
  } finally {
    await app.close();
  }
});
