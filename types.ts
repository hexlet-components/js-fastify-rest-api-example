import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schemas from './db/schema.js'

export type DrizzleSchema = typeof schemas[keyof typeof schemas]
export type DrizzleDB = ReturnType<typeof drizzle<typeof schemas>>

export type CourseLesson = typeof schemas.courseLessons.$inferSelect
export type Course = typeof schemas.courses.$inferSelect
export type User = typeof schemas.users.$inferSelect
