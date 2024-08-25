import vine from '@vinejs/vine'
import uniqueRule from '../rules/unique.js'
import { users } from '../db/schema.js'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schemas from '../db/schema.js'

/**
 * @typedef {typeof userType} UserType
 */
const userType = users.$inferSelect

const schema = vine.object({
  email: vine.string().email().use(uniqueRule({ schema: users })),
})
const validator = vine.compile(schema)

/**
 * @implements {Partial<UserType>}
 */
class User {
  /**
   * @param {ReturnType<typeof drizzle<typeof schemas>>} db
   * @param {Partial<UserType>} data
   */
  static validate(db, data) {
    return validator.validate(data, { meta: { db } })
  }
}

export default User
