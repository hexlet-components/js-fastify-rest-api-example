import { sql } from 'drizzle-orm'
import {
  text,
  integer,
  sqliteTable,
} from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  fullName: text('full_name'),
  email: text('email').notNull().unique(),
  updatedAt: text('updated_at'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(unixepoch())`),
})

export const courses = sqliteTable('courses', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  creatorId: integer('creator_id').references(() => users.id).notNull(),
  description: text('description').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(unixepoch())`),
})

export const courseLessons = sqliteTable('course_lessons', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  courseId: integer('courseId').references(() => courses.id).notNull(),
  body: text('body').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(unixepoch())`),
})
