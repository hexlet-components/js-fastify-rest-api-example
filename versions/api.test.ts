import assert from "node:assert/strict";
import { test } from "node:test";
import { buildVersionedServer } from "./app.ts";
import { createClient as clientOne } from "./v1/client/index.ts";
import { createClient as clientTwo } from "./v2/client/index.ts";
import { getCourse as getOne } from "./v1/sdk.gen.ts";
import { getCourse as getTwo } from "./v2/sdk.gen.ts";
test("each SDK calls its own incompatible representation", async () => {
  const app = await buildVersionedServer();
  const fetch: typeof globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    const result = await app.inject({ url: url.pathname });
    return new Response(result.body, {
      status: result.statusCode,
      headers: result.headers as HeadersInit,
    });
  };
  try {
    const a = await getOne({
      client: clientOne({ baseUrl: "http://catalog/v1", fetch }),
      path: { courseId: 1 },
    });
    const b = await getTwo({
      client: clientTwo({ baseUrl: "http://catalog/v2", fetch }),
      path: { courseId: 1 },
    });
    assert.deepEqual(a.data, { id: 1, title: "HTTP" });
    assert.deepEqual(b.data, { id: 1, name: "HTTP" });
    assert.equal((await app.inject("/v1/openapi.json")).json().servers[0].url, "/v1");
    assert.equal((await app.inject("/v2/openapi.json")).json().servers[0].url, "/v2");
  } finally {
    await app.close();
  }
});
