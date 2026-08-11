import { test } from "vitest";
import * as assert from "node:assert";
import { getAuthHeader, build } from "../../helper.ts";
import { buildCourse } from "../../../lib/data.ts";
import { pick } from "es-toolkit";

test("get courses", async () => {
  const app = await build();

  const res = await app.inject({
    url: "/courses",
  });
  assert.equal(res.statusCode, 200, res.body);
});

test("get courses/:id", async () => {
  const app = await build();

  const course = await app.db.query.courses.findFirst();
  assert.ok(course);

  const res = await app.inject({
    url: `/courses/${course.id}`,
  });
  assert.equal(res.statusCode, 200, res.body);
});

test("post courses", async () => {
  const app = await build();
  const body = buildCourse();

  const authHeader = await getAuthHeader(app);
  const res = await app.inject({
    method: "post",
    url: `/courses`,
    headers: {
      ...authHeader,
    },
    body: body,
  });
  assert.equal(res.statusCode, 201, res.body);
});

test("put courses/:id", async () => {
  const app = await build();

  const course = await app.db.query.courses.findFirst();
  assert.ok(course);

  const authHeader = await getAuthHeader(app, course.creatorId);
  const res = await app.inject({
    method: "put",
    url: `/courses/${course.id}`,
    headers: {
      ...authHeader,
    },
    body: pick(buildCourse(), ["name", "description"]),
  });
  assert.equal(res.statusCode, 200, res.body);
});

test("delete courses/:id", async () => {
  const app = await build();

  const course = await app.db.query.courses.findFirst();
  assert.ok(course);

  const authHeader = await getAuthHeader(app, course.creatorId);
  const res = await app.inject({
    method: "delete",
    headers: {
      ...authHeader,
    },
    url: `/courses/${course.id}`,
  });

  assert.equal(res.statusCode, 204, res.body);
});
