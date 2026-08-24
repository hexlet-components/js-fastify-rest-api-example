import { test } from "vitest";
import * as assert from "node:assert";
import { eq } from "drizzle-orm";
import { build, getAuthHeader } from "../../helper.ts";
import * as schemas from "../../../src/db/schema.ts";

// Без условных запросов два одновременных PUT молча перезаписывают друг друга:
// второй не знает, что запись изменилась после того, как он её прочитал.

test("a course carries an ETag and honours If-None-Match", async () => {
  const app = await build();
  const course = await app.db.query.courses.findFirst();
  assert.ok(course);

  const first = await app.inject({ url: `/courses/${course.id}` });
  assert.equal(first.statusCode, 200, first.body);
  const tag = first.headers.etag as string;
  assert.match(tag, /^W\/"\d+"$/);

  const cached = await app.inject({
    url: `/courses/${course.id}`,
    headers: { "If-None-Match": tag },
  });
  assert.equal(cached.statusCode, 304);
  assert.equal(cached.body, "");
});

test("a stale If-Match is rejected instead of overwriting", async () => {
  const app = await build();
  const course = await app.db.query.courses.findFirst();
  assert.ok(course);
  const authHeader = await getAuthHeader(app, course.creatorId);

  const fetched = await app.inject({ url: `/courses/${course.id}` });
  const stale = fetched.headers.etag as string;

  // Кто-то другой успел изменить запись.
  const other = await app.inject({
    method: "put",
    url: `/courses/${course.id}`,
    headers: { ...authHeader },
    body: { name: "Changed by someone else" },
  });
  assert.equal(other.statusCode, 200, other.body);

  const conflicting = await app.inject({
    method: "put",
    url: `/courses/${course.id}`,
    headers: { ...authHeader, "If-Match": stale },
    body: { name: "Would silently overwrite" },
  });
  assert.equal(conflicting.statusCode, 412, conflicting.body);

  // Перечитывается именно та запись, а не «первая»: без ORDER BY postgres
  // порядок строк не обещает, и после UPDATE запись уезжает в конец.
  const stored = await app.db.query.courses.findFirst({
    where: eq(schemas.courses.id, course.id),
  });
  assert.equal(stored?.name, "Changed by someone else");
});

test("a fresh If-Match goes through", async () => {
  const app = await build();
  const course = await app.db.query.courses.findFirst();
  assert.ok(course);
  const authHeader = await getAuthHeader(app, course.creatorId);

  const fetched = await app.inject({ url: `/courses/${course.id}` });
  const fresh = fetched.headers.etag as string;

  const res = await app.inject({
    method: "put",
    url: `/courses/${course.id}`,
    headers: { ...authHeader, "If-Match": fresh },
    body: { name: "Renamed with a fresh validator" },
  });
  assert.equal(res.statusCode, 200, res.body);
  assert.notEqual(res.headers.etag, fresh, "ETag должен смениться после правки");
});

// Заголовок необязателен: клиенты, которым конкурентность не важна, работают
// как раньше.
test("a request without If-Match still works", async () => {
  const app = await build();
  const course = await app.db.query.courses.findFirst();
  assert.ok(course);
  const authHeader = await getAuthHeader(app, course.creatorId);

  const res = await app.inject({
    method: "put",
    url: `/courses/${course.id}`,
    headers: { ...authHeader },
    body: { name: "No precondition" },
  });
  assert.equal(res.statusCode, 200, res.body);
});

test("a stale If-Match blocks deletion too", async () => {
  const app = await build();
  const course = await app.db.query.courses.findFirst();
  assert.ok(course);
  const authHeader = await getAuthHeader(app, course.creatorId);

  const fetched = await app.inject({ url: `/courses/${course.id}` });
  const stale = fetched.headers.etag as string;

  await app.inject({
    method: "put",
    url: `/courses/${course.id}`,
    headers: { ...authHeader },
    body: { name: "Touched" },
  });

  const res = await app.inject({
    method: "delete",
    url: `/courses/${course.id}`,
    headers: { ...authHeader, "If-Match": stale },
  });
  assert.equal(res.statusCode, 412, res.body);

  const survivors = await app.db.query.courses.findMany();
  assert.ok(survivors.some((item) => item.id === course.id));
});
