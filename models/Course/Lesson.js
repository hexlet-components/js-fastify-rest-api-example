import vine from '@vinejs/vine'
import { courseLessons } from '../../db/schema.js'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schemas from '../../db/schema.js'

/**
 * @typedef {typeof courseLessonType} CourseLessonType
 */
const courseLessonType = courseLessons.$inferSelect

const schema = vine.object({
}).allowUnknownProperties()
const validator = vine.compile(schema)

/**
 * @implements {Partial<CourseLessonType>}
 */
class Lesson {
  /**
   * @param {ReturnType<typeof drizzle<typeof schemas>>} db
   * @param {Partial<CourseLessonType>} data
   */
  static validate(db, data) {
    return validator.validate(data, { meta: { db } })
  }
}

export default Lesson
