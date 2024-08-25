import {
  text,
  integer,
  sqliteTable,
} from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  fullName: text('full_name'),
  email: text('email').notNull().unique(),
})
