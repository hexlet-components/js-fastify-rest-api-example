import vine from '@vinejs/vine'
import uniqueRule from '../rules/unique.js'
import { courses } from '../db/schema.js'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schemas from '../db/schema.js'

/**
 * @typedef {typeof courseType} CourseType
 */
const courseType = courses.$inferSelect

const schema = vine.object({
  // name: vine.string(),
  // description: vine.string(),
}).allowUnknownProperties()
const validator = vine.compile(schema)

/**
 * @implements {Partial<CourseType>}
 */
class Course {
  /**
   * @param {ReturnType<typeof drizzle<typeof schemas>>} db
   * @param {Partial<CourseType>} data
   */
  static validate(db, data) {
    return validator.validate(data, { meta: { db } })
  }
}

export default Course
