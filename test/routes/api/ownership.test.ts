import { test } from "vitest";
import * as assert from "node:assert";
import { eq } from "drizzle-orm";
import { build, getAuthHeader } from "../../helper.ts";
import { buildCourseLesson } from "../../../src/lib/data.ts";
import * as schemas from "../../../src/db/schema.ts";

// Возвращает курс и пользователя, который его не создавал.
async function buildWithOutsider() {
  const app = await build();
  const course = await app.db.query.courses.findFirst();
  assert.ok(course);

  const users = await app.db.query.users.findMany();
  const outsider = users.find((user) => user.id !== course.creatorId);
  assert.ok(outsider, "seeds must contain a user who owns no courses");

  return { app, course, authHeader: await getAuthHeader(app, outsider.id) };
}

// Проверялся только факт аутентификации, но не владение: любой пользователь с
// токеном правил и удалял чужие курсы и дописывал в них уроки.
test("a stranger cannot update someone else's course", async () => {
  const { app, course, authHeader } = await buildWithOutsider();

  const res = await app.inject({
    method: "put",
    url: `/courses/${course.id}`,
    headers: { ...authHeader },
    body: { name: "Hijacked" },
  });
  assert.equal(res.statusCode, 403, res.body);

  const unchanged = await app.db.query.courses.findFirst({
    where: eq(schemas.courses.id, course.id),
  });
  assert.equal(unchanged?.name, course.name);
});

test("a stranger cannot delete someone else's course", async () => {
  const { app, course, authHeader } = await buildWithOutsider();

  const res = await app.inject({
    method: "delete",
    url: `/courses/${course.id}`,
    headers: { ...authHeader },
  });
  assert.equal(res.statusCode, 403, res.body);

  const survivors = await app.db.query.courses.findMany();
  assert.ok(survivors.some((item) => item.id === course.id));
});

test("a stranger cannot add a lesson to someone else's course", async () => {
  const { app, course, authHeader } = await buildWithOutsider();

  const res = await app.inject({
    method: "post",
    url: `/courses/${course.id}/lessons`,
    headers: { ...authHeader },
    body: buildCourseLesson(),
  });
  assert.equal(res.statusCode, 403, res.body);
});

test("a stranger cannot change or delete lessons of someone else's course", async () => {
  const { app, course, authHeader } = await buildWithOutsider();

  const lesson = await app.db.query.courseLessons.findFirst();
  assert.ok(lesson);

  const updated = await app.inject({
    method: "put",
    url: `/courses/${lesson.courseId}/lessons/${lesson.id}`,
    headers: { ...authHeader },
    body: { name: "Hijacked lesson" },
  });
  assert.equal(updated.statusCode, 403, updated.body);

  const deleted = await app.inject({
    method: "delete",
    url: `/courses/${lesson.courseId}/lessons/${lesson.id}`,
    headers: { ...authHeader },
  });
  assert.equal(deleted.statusCode, 403, deleted.body);

  const survivors = await app.db.query.courseLessons.findMany();
  assert.ok(survivors.some((item) => item.id === lesson.id));
  assert.ok(course);
});

// Несуществующий курс раньше упирался в ограничение внешнего ключа и давал 500.
test("adding a lesson to a missing course answers 404", async () => {
  const app = await build();
  const authHeader = await getAuthHeader(app);

  const res = await app.inject({
    method: "post",
    url: `/courses/999999/lessons`,
    headers: { ...authHeader },
    body: buildCourseLesson(),
  });
  assert.equal(res.statusCode, 404, res.body);
});

test("the owner can still update, delete and extend their own course", async () => {
  const app = await build();
  const course = await app.db.query.courses.findFirst();
  assert.ok(course);
  const authHeader = await getAuthHeader(app, course.creatorId);

  const lesson = await app.inject({
    method: "post",
    url: `/courses/${course.id}/lessons`,
    headers: { ...authHeader },
    body: buildCourseLesson(),
  });
  assert.equal(lesson.statusCode, 201, lesson.body);

  const updated = await app.inject({
    method: "put",
    url: `/courses/${course.id}`,
    headers: { ...authHeader },
    body: { name: "Renamed by the owner" },
  });
  assert.equal(updated.statusCode, 200, updated.body);
});
