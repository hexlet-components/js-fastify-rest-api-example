import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { buildServer } from "../src/app.ts";
import { createStore } from "../src/db.ts";
import { runExports, deliverEvents, sign, verify } from "../src/services.ts";
import { createClient } from "../generated/client/index.ts";
import { listCourses } from "../generated/sdk.gen.ts";

test("catalog HTTP behavior on PostgreSQL", async (t) => {
  const app = await buildServer();
  t.after(() => app.close());
  const store = await createStore();
  t.after(() => store.close());
  const token = app.jwt.sign({ id: 1, scopes: ["courses:write"] });
  const headers = { authorization: `Bearer ${token}` };
  const create = (key: string, body = { title: "New", description: null as string | null }) =>
    app.inject({
      method: "POST",
      url: "/courses",
      headers: { ...headers, "idempotency-key": key },
      payload: body,
    });
  let courseId = 0;
  await t.test("SDK reads collection and headers", async () => {
    const client = createClient({
      baseUrl: "http://catalog",
      fetch: async (input) => {
        const request = new Request(input);
        const url = new URL(request.url);
        const response = await app.inject({
          method: request.method as "GET",
          url: url.pathname + url.search,
          headers: Object.fromEntries(request.headers),
        });
        return new Response(response.body, {
          status: response.statusCode,
          headers: response.headers as HeadersInit,
        });
      },
    });
    const value = await listCourses({ client, query: { limit: 1 } });
    assert.equal(value.response!.status, 200);
    assert.equal(value.data?.data.length, 1);
    assert.match(value.response!.headers.get("link")!, /next/);
  });
  await t.test("concurrent replay creates one course and survives restart", async () => {
    const key = randomUUID();
    const responses = await Promise.all([create(key), create(key)]);
    for (const response of responses) assert.equal(response.statusCode, 201, response.body);
    assert.deepEqual(responses[0].json(), responses[1].json());
    courseId = responses[0].json().id;
    const second = await buildServer();
    try {
      const response = await second.inject({
        method: "POST",
        url: "/courses",
        headers: { ...headers, "idempotency-key": key },
        payload: { title: "New", description: null },
      });
      assert.equal(response.json().id, courseId);
    } finally {
      await second.close();
    }
    assert.equal((await create(key, { title: "Other", description: null })).statusCode, 409);
  });
  await t.test("missing, expired and malformed credentials", async () => {
    assert.equal((await app.inject("/me")).statusCode, 401);
    assert.equal(
      (await app.inject({ url: "/me", headers: { authorization: "Bearer broken" } })).statusCode,
      401,
    );
    const expired = app.jwt.sign({ id: 1, scopes: [] }, { expiresIn: -1 });
    assert.equal(
      (await app.inject({ url: "/me", headers: { authorization: `Bearer ${expired}` } }))
        .statusCode,
      401,
    );
  });
  await t.test("scope and ownership", async () => {
    const noScope = app.jwt.sign({ id: 1, scopes: [] });
    const other = app.jwt.sign({ id: 2, scopes: ["courses:write"] });
    assert.equal(
      (
        await app.inject({
          method: "PATCH",
          url: `/courses/${courseId}`,
          headers: { authorization: `Bearer ${noScope}` },
          payload: { title: "x" },
        })
      ).statusCode,
      403,
    );
    assert.equal(
      (
        await app.inject({
          method: "PATCH",
          url: `/courses/${courseId}`,
          headers: { authorization: `Bearer ${other}` },
          payload: { title: "x" },
        })
      ).statusCode,
      404,
    );
  });
  await t.test("validation and body media type", async () => {
    assert.equal((await create(randomUUID(), { title: "", description: null })).statusCode, 400);
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/courses",
          headers: { ...headers, "idempotency-key": randomUUID() },
        })
      ).statusCode,
      400,
    );
    assert.equal(
      (
        await app.inject({
          method: "PATCH",
          url: `/courses/${courseId}`,
          headers: { ...headers, "content-type": "text/plain" },
          payload: "wrong",
        })
      ).statusCode,
      415,
    );
  });
  await t.test("patch omission and explicit null", async () => {
    let response = await app.inject({
      method: "PATCH",
      url: `/courses/${courseId}`,
      headers,
      payload: { description: "Draft" },
    });
    assert.equal(response.json().description, "Draft");
    response = await app.inject({
      method: "PATCH",
      url: `/courses/${courseId}`,
      headers,
      payload: { title: "Updated" },
    });
    assert.equal(response.json().description, "Draft");
    response = await app.inject({
      method: "PATCH",
      url: `/courses/${courseId}`,
      headers,
      payload: { description: null },
    });
    assert.equal(response.json().description, null);
  });
  await t.test("pagination follows link and rejects invalid cursor", async () => {
    const response = await app.inject("/courses?limit=1");
    const next = response.json().links.next;
    assert.ok(next);
    const following = await app.inject(next);
    assert.notEqual(response.json().data[0].id, following.json().data[0].id);
    assert.equal((await app.inject("/courses?cursor=bad!")).statusCode, 400);
    assert.equal((await app.inject("/courses?title=NONEXISTENT")).json().data.length, 0);
  });
  await t.test("parent identity and relationships", async () => {
    assert.equal((await app.inject("/courses/999999/lessons/1")).statusCode, 404);
    const url = `/users/1/courses/${courseId}`;
    assert.equal((await app.inject({ method: "PUT", url, headers })).statusCode, 204);
    assert.equal((await app.inject({ method: "DELETE", url, headers })).statusCode, 204);
    assert.equal(
      (
        await app.inject({
          method: "PUT",
          url: "/users/1/courses",
          headers,
          payload: { courseIds: [courseId] },
        })
      ).statusCode,
      204,
    );
    assert.equal(
      (await app.inject({ url: "/users/1/courses", headers })).json().data[0].id,
      courseId,
    );
  });
  await t.test("binary file, media type, size and redirect", async () => {
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);
    const response = await app.inject({
      method: "PUT",
      url: `/courses/${courseId}/cover`,
      headers: { ...headers, "content-type": "image/png" },
      payload: png,
    });
    assert.equal(response.statusCode, 201, response.body);
    const file = response.json();
    const content = await app.inject(`/files/${file.id}/content`);
    assert.deepEqual(content.rawPayload, png);
    assert.match(content.headers["content-type"]!, /image\/png/);
    assert.equal((await app.inject(file.downloadUrl)).statusCode, 303);
    assert.equal((await app.inject("/files/999999/content")).statusCode, 404);
    assert.equal(
      (
        await app.inject({
          method: "PUT",
          url: `/courses/${courseId}/cover`,
          headers: { ...headers, "content-type": "image/png" },
          payload: Buffer.alloc(1024 * 1024 + 1),
        })
      ).statusCode,
      413,
    );
  });
  await t.test("asynchronous operation, replay, result and failure", async () => {
    const key = randomUUID();
    const send = () =>
      app.inject({
        method: "POST",
        url: "/exports",
        headers: { ...headers, "idempotency-key": key },
        payload: { format: "json" },
      });
    const response = await send();
    assert.equal(response.statusCode, 202, response.body);
    assert.deepEqual((await send()).json(), response.json());
    const location = response.headers.location!;
    assert.equal((await app.inject({ url: location, headers })).json().status, "pending");
    await runExports(store);
    const complete = (await app.inject({ url: location, headers })).json();
    assert.equal(complete.status, "succeeded");
    assert.equal((await app.inject({ url: complete.resultUrl, headers })).statusCode, 200);
    const failed = await app.inject({
      method: "POST",
      url: "/exports",
      headers: { ...headers, "idempotency-key": randomUUID() },
      payload: { format: "csv" },
    });
    await runExports(store, true);
    assert.equal(
      (await app.inject({ url: failed.headers.location!, headers })).json().status,
      "failed",
    );
  });
  await t.test("expected resource version rejects stale update", async () => {
    const current = (await app.inject(`/courses/${courseId}`)).json();
    const request = {
      method: "POST" as const,
      url: `/courses/${courseId}/publication`,
      headers,
      payload: { expectedVersion: current.version },
    };
    assert.equal((await app.inject(request)).statusCode, 200);
    assert.equal((await app.inject(request)).statusCode, 409);
  });
  await t.test("webhook signature, failed delivery and retry retain event id", async () => {
    const ids: string[] = [];
    const receiver = await import("fastify").then((x) => x.default());
    let attempts = 0;
    receiver.post("/", async (request, reply) => {
      const raw = JSON.stringify(request.body);
      assert.equal(verify(raw, String(request.headers["x-signature"]), "secret"), true);
      ids.push(String(request.headers["x-event-id"]));
      return reply.code(++attempts === 1 ? 503 : 204).send();
    });
    await receiver.listen({ port: 0, host: "127.0.0.1" });
    try {
      await deliverEvents(store, receiver.listeningOrigin, "secret");
      await deliverEvents(store, receiver.listeningOrigin, "secret");
      assert.equal(ids[0], ids[1]);
      assert.equal(verify("{}", "bad", "secret"), false);
      assert.equal(sign("{}", "secret").length, 64);
    } finally {
      await receiver.close();
    }
  });
  await t.test("204 has empty body", async () => {
    const response = await app.inject({ method: "DELETE", url: `/courses/${courseId}`, headers });
    assert.equal(response.statusCode, 204, response.body);
    assert.equal(response.body, "");
  });
});
test("rate limit distinguishes principals and resets", async (t) => {
  const app = await buildServer({ rateLimit: true });
  t.after(() => app.close());
  const token = app.jwt.sign({ id: 1, scopes: [] });
  const headers = { authorization: `Bearer ${token}` };
  for (let i = 0; i < 3; i++)
    assert.equal((await app.inject({ url: "/me", headers })).statusCode, 200);
  const limited = await app.inject({ url: "/me", headers });
  assert.equal(limited.statusCode, 429, limited.body);
  assert.ok(limited.headers["retry-after"]);
  const other = app.jwt.sign({ id: 2, scopes: [] });
  assert.equal(
    (await app.inject({ url: "/me", headers: { authorization: `Bearer ${other}` } })).statusCode,
    200,
  );
  await new Promise((resolve) => setTimeout(resolve, 1100));
  assert.equal((await app.inject({ url: "/me", headers })).statusCode, 200);
});
