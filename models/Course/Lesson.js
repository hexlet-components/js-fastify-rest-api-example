import vine from '@vinejs/vine'

const schema = vine.object({
}).allowUnknownProperties()
const validator = vine.compile(schema)

class Lesson {
  /**
   * @param {import('../../types.js').DrizzleDB} db
   * @param {Partial<import('../../types.js').CourseLesson>} data
   */
  static validate(db, data) {
    return validator.validate(data, { meta: { db } })
  }
}

export default Lesson
