import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Таймстемпы ведёт drizzle, а не SQL-дефолты: updatedAt иначе не обновляется
// никогда — обработчики его не писали, а DEFAULT срабатывает только на INSERT.
// Тип integer, а не text: раньше default (unixepoch()) клал число в текстовую
// колонку, и наружу уезжала строка вида "1787349516".
const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
};

export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  fullName: text("full_name"),
  email: text("email").notNull().unique(),
  passwordDigest: text("password_digest").notNull(),
  ...timestamps,
});

export const courses = sqliteTable("courses", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  // Каскад, а не запрет: контракт обещает у DELETE только 204, и удаление
  // автора курсов иначе падало в 500 на нарушении внешнего ключа.
  creatorId: integer("creator_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  description: text("description").notNull(),
  ...timestamps,
});

export const courseLessons = sqliteTable("course_lessons", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  courseId: integer("courseId")
    .references(() => courses.id, { onDelete: "cascade" })
    .notNull(),
  body: text("body").notNull(),
  ...timestamps,
});
