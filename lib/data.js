import { faker } from '@faker-js/faker'
import { users, courses, courseLessons } from '../db/schema.js'

/**
 * @typedef {typeof userType} UserType
 */
const userType = users.$inferSelect

/**
 * @typedef {typeof courseType} CourseType
 */
const courseType = courses.$inferSelect

/**
 * @typedef {typeof courseLessonType} CourseLessonType
 */
const courseLessonType = courseLessons.$inferSelect

/**
 * @param {Partial<UserType>} params
 */
export function buildUser(params = {}) {
  const user = {
    fullName: faker.person.fullName(),
    email: faker.internet.email(),
  }

  return Object.assign({}, user, params)
}

/**
 * @param {Partial<CourseType>} params
 */
export function buildCourse(params = {}) {
  const user = {
    name: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
  }

  return Object.assign({}, user, params)
}

/**
 * @param {Partial<CourseLessonType>} params
 */
export function buildCourseLesson(params = {}) {
  const lesson = {
    name: faker.lorem.sentence(),
    body: faker.lorem.paragraph(),
  }

  return Object.assign({}, lesson, params)
}
