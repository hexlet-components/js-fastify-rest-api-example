import { drizzle } from 'drizzle-orm/better-sqlite3'
import vine from '@vinejs/vine'
import * as schemas from '../db/schema.js'
import { eq } from 'drizzle-orm'

/**
 * @typedef {typeof schemas[keyof typeof schemas]} Schema
 */

/**
 * @param {any} value
 * @param {{ schema: Schema }} options
 * @param {import('@vinejs/vine/types').FieldContext} field
 */
async function unique(value, options, field,
) {
  /**
   * We do not want to deal with non-string
   * values. The "string" rule will handle the
   * the validation.
   */
  if (typeof value !== 'string') {
    return
  }

  /** @type {ReturnType<typeof drizzle<typeof schemas>>} */
  const db = field.meta.db
  const [row] = await db.select().from(options.schema)
    .where(eq(options.schema[field.name], value))

  if (row) {
    field.report(
      `The {{ field }} field (= ${value}) is not unique.`,
      'unique',
      field,
    )
  }
}

export default vine.createRule(unique, {
  // implicit: true,
  isAsync: true,
})
