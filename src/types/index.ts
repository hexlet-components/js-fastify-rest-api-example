import type { drizzle } from "drizzle-orm/pglite";
import type * as schemas from "../db/schema.ts";

// Таблица, а не «схема»: schema в проекте уже занято под другое.
export type DrizzleTable = (typeof schemas)[keyof typeof schemas];
export type DrizzleDB = ReturnType<typeof drizzle<typeof schemas>>;

export type CourseLesson = typeof schemas.courseLessons.$inferSelect;
export type Course = typeof schemas.courses.$inferSelect;
export type User = typeof schemas.users.$inferSelect;

export type CourseLessonInsert = typeof schemas.courseLessons.$inferInsert;
export type CourseInsert = typeof schemas.courses.$inferInsert;
