import { faker } from "@faker-js/faker";
import type { Course, CourseLesson, User } from "../types/index.js";
import { hashPassword } from "./password.ts";

// Пароль у всех тестовых пользователей один: тестам нужно уметь логиниться под
// любым из них, а перебирать значения незачем.
export const DEFAULT_PASSWORD = "correct-horse-battery-staple";

// Форма запроса к API: с открытым паролем.
export function buildUser(params: Partial<User> & { password?: string } = {}) {
  const user = {
    fullName: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    password: DEFAULT_PASSWORD,
  };

  return Object.assign({}, user, params);
}

// scrypt считается десятки миллисекунд — это его работа. Но сиды прогоняются
// на каждый build() в тестах, и пароль там всегда один, поэтому хеш дефолтного
// считается один раз на процесс.
let defaultDigest: Promise<string> | undefined;

function digestOf(password: string) {
  if (password !== DEFAULT_PASSWORD) return hashPassword(password);
  defaultDigest ??= hashPassword(DEFAULT_PASSWORD);
  return defaultDigest;
}

// Форма строки в базе: с хешем вместо пароля. Нужна сидам и тестам, которые
// заводят пользователя напрямую, минуя эндпоинт.
export async function buildUserRecord(params: Partial<User> = {}) {
  const { password, ...rest } = buildUser(params);
  return Object.assign({}, rest, { passwordDigest: await digestOf(password) }, params);
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
