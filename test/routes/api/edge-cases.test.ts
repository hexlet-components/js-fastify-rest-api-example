import { test } from "vitest";
import * as assert from "node:assert";
import { build, getAuthHeader } from "../../helper.ts";

// Всё в этом файле нашёл schemathesis, генерируя запросы из спеки. Обычные
// тесты на happy path эти входы не покрывали, и каждый из них давал 500.

test("an empty update body leaves the record as it was", async () => {
  const app = await build();
  const user = await app.db.query.users.findFirst();
  assert.ok(user);
  const authHeader = await getAuthHeader(app);

  const res = await app.inject({
    method: "put",
    url: `/users/${user.id}`,
    headers: { ...authHeader },
    body: {},
  });

  assert.equal(res.statusCode, 200, res.body);
  assert.equal(JSON.parse(res.body).fullName, user.fullName);
});

test("an empty course update body leaves the record as it was", async () => {
  const app = await build();
  const course = await app.db.query.courses.findFirst();
  assert.ok(course);
  const authHeader = await getAuthHeader(app, course.creatorId);

  const res = await app.inject({
    method: "put",
    url: `/courses/${course.id}`,
    headers: { ...authHeader },
    body: {},
  });

  assert.equal(res.statusCode, 200, res.body);
  assert.equal(JSON.parse(res.body).name, course.name);
});

// Раньше это делал ON DELETE CASCADE из миграции: удаление автора молча
// сносило его курсы вместе с уроками. Курс не перестаёт существовать от того,
// что автор ушёл, поэтому удаление отклоняется.
test("deleting a user who still owns courses is rejected", async () => {
  const app = await build();
  const course = await app.db.query.courses.findFirst();
  assert.ok(course);
  const authHeader = await getAuthHeader(app, course.creatorId);

  const res = await app.inject({
    method: "delete",
    url: `/users/${course.creatorId}`,
    headers: { ...authHeader },
  });

  assert.equal(res.statusCode, 409, res.body);
  const left = await app.db.query.courses.findMany();
  assert.ok(left.some((item) => item.creatorId === course.creatorId));
});

test("a user without courses is deleted", async () => {
  const app = await build();
  const users = await app.db.query.users.findMany();
  const courses = await app.db.query.courses.findMany();
  const owners = new Set(courses.map((item) => item.creatorId));
  const free = users.find((user) => !owners.has(user.id));
  assert.ok(free, "сиды должны содержать пользователя без курсов");

  const authHeader = await getAuthHeader(app, free.id);
  const res = await app.inject({
    method: "delete",
    url: `/users/${free.id}`,
    headers: { ...authHeader },
  });
  assert.equal(res.statusCode, 204, res.body);
});

test("deleting a course removes its lessons in one transaction", async () => {
  const app = await build();
  const lesson = await app.db.query.courseLessons.findFirst();
  assert.ok(lesson);
  const course = await app.db.query.courses.findFirst();
  assert.ok(course);
  const authHeader = await getAuthHeader(app, course.creatorId);

  const res = await app.inject({
    method: "delete",
    url: `/courses/${lesson.courseId}`,
    headers: { ...authHeader },
  });

  assert.equal(res.statusCode, 204, res.body);
  const left = await app.db.query.courseLessons.findMany();
  assert.deepStrictEqual(
    left.filter((item) => item.courseId === lesson.courseId),
    [],
  );
});

// Спека не ограничивала page, и (page - 1) * perPage переполнялся.
test("an out-of-range page is rejected by the contract", async () => {
  const app = await build();

  for (const page of ["0", "-1", "-1.79e+308", "1.5"]) {
    const res = await app.inject({ url: `/courses?page=${encodeURIComponent(page)}` });
    assert.equal(res.statusCode, 400, `page=${page} -> ${res.statusCode}`);
  }
});

// UserCreateDTO принимал имя, которое модель ответа потом браковала, и
// создание падало в 500 уже после записи в базу.
test("a full name shorter than the response model allows is rejected", async () => {
  const app = await build();

  const res = await app.inject({
    method: "post",
    url: "/users",
    body: { email: "shortname@hexlet.io", fullName: "A", password: "12345678" },
  });

  assert.equal(res.statusCode, 400, res.body);
});

// Postgres не хранит NUL в text-колонках, и без проверки на входе такой ввод
// доезжал до insert и уходил наружу как 500. Нашёл контрактный прогон.
test("a NUL character in a text field is rejected, not stored", async () => {
  const app = await build();

  const res = await app.inject({
    method: "post",
    url: "/users",
    body: { email: "nul\u0000@hexlet.io", password: "correct-horse-battery-staple" },
  });
  assert.equal(res.statusCode, 400, res.body);

  const stored = await app.db.query.users.findMany();
  assert.ok(!stored.some((user) => user.email.includes("nul")));
});
