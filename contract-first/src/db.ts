import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

export const courses = pgTable("courses", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: text().notNull(),
  description: text(),
  ownerId: integer("owner_id").notNull(),
  version: integer().notNull().default(1),
  published: boolean().notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});
export async function createStore(
  databaseUrl = process.env.DATABASE_URL ?? "postgres://catalog:catalog@localhost:55432/catalog",
) {
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);
  await pool.query(await readFile(new URL("../migrations/0001.sql", import.meta.url), "utf8"));
  const project = (row: typeof courses.$inferSelect) => ({
    ...row,
    createdAt: new Date(row.createdAt).toISOString(),
  });
  return {
    db,
    pool,
    async getCourse(id: number) {
      const [row] = await db.select().from(courses).where(eq(courses.id, id));
      return row ? project(row) : undefined;
    },
    async createCourse(input: { title: string; description?: string | null }, ownerId: number) {
      const [row] = await db
        .insert(courses)
        .values({ ...input, ownerId })
        .returning();
      return project(row);
    },
    async seed() {
      if ((await pool.query("SELECT count(*) FROM courses")).rows[0].count !== "0") return;
      const course = await this.createCourse(
        { title: "HTTP", description: "Requests and responses" },
        1,
      );
      await this.createCourse({ title: "TypeScript", description: null }, 1);
      await this.createCourse({ title: "SQL", description: null }, 2);
      await pool.query("INSERT INTO lessons VALUES (1,$1,$2)", [course.id, "Request"]);
    },
    async close() {
      await pool.end();
    },
  };
}
export type Store = Awaited<ReturnType<typeof createStore>>;
