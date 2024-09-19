import vine from '@vinejs/vine'
import uniqueRule from '../rules/unique.js'
import { users } from '../db/schema.js'

const schema = vine.object({
  email: vine.string()
    .email()
    .normalizeEmail({ all_lowercase: true })
    .use(uniqueRule({ schema: users }))
}).allowUnknownProperties()
const validator = vine.compile(schema)

class User {
  /**
   * @param {import('../types.js').DrizzleDB} db
   * @param {Partial<import('../types.js').User>} data
   */
  static validate(db, data) {
    return validator.validate(data, { meta: { db } })
  }
}

export default User
