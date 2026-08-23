import { test } from "vitest";
import * as assert from "node:assert";
import { buildClient, getAuthHeader, responseOf } from "../../../helper.ts";
import { buildCourseLesson } from "../../../../lib/data.ts";
import {
  coursesLessonsCreate,
  coursesLessonsIndex,
  coursesLessonsShow,
} from "../../../../types/handlers/sdk.gen.js";

test("get lessons", async () => {
  const { app, client } = await buildClient();

  const lesson = await app.db.query.courseLessons.findFirst();
  assert.ok(lesson);

  const res = await coursesLessonsIndex({ client, path: { courseId: lesson.courseId } });
  assert.equal(responseOf(res).status, 200);
});

test("get lessons/:id", async () => {
  const { app, client } = await buildClient();

  const lesson = await app.db.query.courseLessons.findFirst();
  assert.ok(lesson);

  const res = await coursesLessonsShow({
    client,
    path: { courseId: lesson.courseId, id: lesson.id },
  });
  assert.equal(responseOf(res).status, 200);
});

test("post lessons", async () => {
  const { app, client } = await buildClient();

  const course = await app.db.query.courses.findFirst();
  assert.ok(course);

  const { name, body } = buildCourseLesson();
  const res = await coursesLessonsCreate({
    client,
    headers: await getAuthHeader(app, course.creatorId),
    path: { courseId: course.id },
    body: { name, body },
  });
  assert.equal(responseOf(res).status, 201, JSON.stringify(res.error));
});
