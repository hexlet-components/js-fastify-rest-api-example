import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { buildServer } from "./app.ts";

test("CRUD preserves data, distinguishes omitted and null, and validates HTTP", async () => {
  const app = await buildServer();
  try {
    const created = await app.inject({
      method: "POST",
      url: "/courses",
      payload: { title: `Test ${randomUUID()}`, description: "Keep me" },
    });
    assert.equal(created.statusCode, 201);
    const course = created.json<{ id: number; title: string; description: string | null }>();
    const url = `/courses/${course.id}`;
    assert.equal(created.headers.location, url);
    assert.equal((await app.inject(url)).json().description, "Keep me");
    const renamed = await app.inject({ method: "PATCH", url, payload: { title: "Changed" } });
    assert.equal(renamed.statusCode, 200);
    assert.equal(renamed.json().description, "Keep me");
    const cleared = await app.inject({ method: "PATCH", url, payload: { description: null } });
    assert.equal(cleared.json().description, null);
    const emptyPatch = await app.inject({ method: "PATCH", url, payload: {} });
    assert.equal(emptyPatch.statusCode, 200);
    const invalid = await app.inject({ method: "PATCH", url, payload: { title: "" } });
    assert.equal(invalid.statusCode, 400);
    assert.match(String(invalid.headers["content-type"]), /^application\/problem\+json/);
    assert.equal(invalid.json().status, 400);
    assert.equal((await app.inject(url)).json().title, "Changed");
    const extra = await app.inject({
      method: "POST",
      url: "/courses",
      payload: { title: "Extra", secret: true },
    });
    assert.equal(extra.statusCode, 400);
    const missingBody = await app.inject({ method: "POST", url: "/courses" });
    assert.equal(missingBody.statusCode, 400);
    const media = await app.inject({
      method: "POST",
      url: "/courses",
      headers: { "content-type": "text/plain" },
      payload: "wrong",
    });
    assert.equal(media.statusCode, 415);
    const deleted = await app.inject({ method: "DELETE", url });
    assert.equal(deleted.statusCode, 204);
    assert.equal(deleted.body, "");
    const absent = await app.inject(url);
    assert.equal(absent.statusCode, 404);
    assert.equal(absent.json().status, 404);
    const repeated = await app.inject({ method: "DELETE", url });
    assert.equal(repeated.statusCode, 404);
    assert.equal((await app.inject("/courses/0")).statusCode, 400);
  } finally {
    await app.close();
  }
});

test("generated SDK uses the same HTTP application", async () => {
  const { createClient } = await import("./generated/client/index.ts");
  const { createCourse, getCourse, deleteCourse } = await import("./generated/sdk.gen.ts");
  const app = await buildServer();
  try {
    const client = createClient({
      baseUrl: "http://catalog.test",
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = new Request(input, init);
        const url = new URL(request.url);
        const response = await app.inject({
          method: request.method as "GET" | "POST" | "DELETE",
          url: url.pathname + url.search,
          headers: Object.fromEntries(request.headers),
          payload: request.body ? await request.text() : undefined,
        });
        return new Response(response.statusCode === 204 ? null : response.body, {
          status: response.statusCode,
          headers: response.headers as HeadersInit,
        });
      },
    });
    const created = await createCourse({ client, body: { title: "SDK course" } });
    assert.equal(created.response?.status, 201);
    assert.ok(created.data);
    const read = await getCourse({ client, path: { courseId: created.data.id } });
    assert.equal(read.response?.status, 200);
    assert.equal(read.data?.title, "SDK course");
    const deleted = await deleteCourse({ client, path: { courseId: created.data.id } });
    assert.equal(deleted.response?.status, 204);
  } finally {
    await app.close();
  }
});
