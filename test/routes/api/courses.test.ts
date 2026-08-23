import { test } from "vitest";
import * as assert from "node:assert";
import { pick } from "es-toolkit";
import { buildClient, getAuthHeader, responseOf } from "../../helper.ts";
import { buildCourse } from "../../../lib/data.ts";
import {
  coursesCreate,
  coursesDestroy,
  coursesIndex,
  coursesShow,
  coursesUpdate,
} from "../../../types/handlers/sdk.gen.js";

// Тесты ходят сгенерированным из спеки клиентом: URL, методы и формы тел
// берутся из контракта, а не переписываются здесь руками.

test("get courses", async () => {
  const { client } = await buildClient();

  const res = await coursesIndex({ client });
  assert.equal(responseOf(res).status, 200);
});

test("get courses/:id", async () => {
  const { app, client } = await buildClient();

  const course = await app.db.query.courses.findFirst();
  assert.ok(course);

  const res = await coursesShow({ client, path: { id: course.id } });
  assert.equal(responseOf(res).status, 200);
});

test("post courses", async () => {
  const { app, client } = await buildClient();

  const res = await coursesCreate({
    client,
    headers: await getAuthHeader(app),
    body: pick(buildCourse(), ["name", "description"]),
  });
  assert.equal(responseOf(res).status, 201, JSON.stringify(res.error));
});

test("put courses/:id", async () => {
  const { app, client } = await buildClient();

  const course = await app.db.query.courses.findFirst();
  assert.ok(course);

  const res = await coursesUpdate({
    client,
    headers: await getAuthHeader(app, course.creatorId),
    path: { id: course.id },
    body: pick(buildCourse(), ["name", "description"]),
  });
  assert.equal(responseOf(res).status, 200, JSON.stringify(res.error));
});

test("delete courses/:id", async () => {
  const { app, client } = await buildClient();

  const course = await app.db.query.courses.findFirst();
  assert.ok(course);

  const res = await coursesDestroy({
    client,
    headers: await getAuthHeader(app, course.creatorId),
    path: { id: course.id },
  });
  assert.equal(responseOf(res).status, 204, JSON.stringify(res.error));
});
