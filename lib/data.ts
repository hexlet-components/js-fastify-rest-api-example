import { faker } from "@faker-js/faker";
import type { Course, CourseLesson, User } from "../types/index.js";

export function buildUser(params: Partial<User> = {}) {
  const user = {
    fullName: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
  };

  return Object.assign({}, user, params);
}

export function buildCourse(params: Partial<Course> = {}) {
  const user = {
    creatorId: null,
    name: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
  };

  return Object.assign({}, user, params);
}

export function buildCourseLesson(params: Partial<CourseLesson> = {}) {
  const lesson = {
    courseId: null,
    name: faker.lorem.sentence(),
    body: faker.lorem.paragraph(),
  };

  return Object.assign({}, lesson, params);
}
