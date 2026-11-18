import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, integer, text } from "drizzle-orm/pg-core";
import { asc, eq } from "drizzle-orm";
import type { CourseInput, CoursePatch } from "./generated/types.gen.ts";

export const courses = pgTable("crud_courses", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: text().notNull(),
  description: text(),
});
export async function createStore(
  databaseUrl = process.env.DATABASE_URL ?? "postgres://catalog:catalog@localhost:55432/catalog",
) {
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS crud_courses (
      id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      title text NOT NULL,
      description text
    )`);
  } catch (error) {
    await pool.end();
    throw error;
  }
  return {
    db,
    pool,
    async listCourses() {
      return db.select().from(courses).orderBy(asc(courses.id));
    },
    async getCourse(courseId: number) {
      const [course] = await db.select().from(courses).where(eq(courses.id, courseId));
      return course;
    },
    async createCourse(input: CourseInput) {
      const [course] = await db.insert(courses).values(input).returning();
      return course!;
    },
    async updateCourse(courseId: number, patch: CoursePatch) {
      if (Object.keys(patch).length === 0) return this.getCourse(courseId);
      const [course] = await db
        .update(courses)
        .set(patch)
        .where(eq(courses.id, courseId))
        .returning();
      return course;
    },
    async deleteCourse(courseId: number) {
      const [course] = await db.delete(courses).where(eq(courses.id, courseId)).returning();
      return course;
    },
    async close() {
      await pool.end();
    },
  };
}
export type Store = Awaited<ReturnType<typeof createStore>>;
