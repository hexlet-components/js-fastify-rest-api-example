import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Нативный timestamptz, а не число: тип колонки теперь говорит, что в ней
// лежит время. Раньше это был integer с unix-миллисекундами, и смысл колонки
// держался на кодеке drizzle да на комментарии рядом.
//
// Таймстемпы ведёт drizzle, а не SQL-дефолты: updatedAt иначе не обновляется
// никогда — обработчики его не писали, а DEFAULT срабатывает только на INSERT.
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
};

// byDefault, а не always: identity always отвергает вставку с явным id, и
// сиды с тестами, которые заводят строку целиком, упёрлись бы в него. В
// sqlite id был алиасом rowid и подставлялся сам — byDefault повторяет это.
const id = integer("id").primaryKey().generatedByDefaultAsIdentity();

export const users = pgTable("users", {
  id,
  fullName: text("full_name"),
  email: text("email").notNull().unique(),
  passwordDigest: text("password_digest").notNull(),
  // Появляется в контракте только с v2 (@added в main.tsp). Nullable: колонка
  // добавляется существующей таблице, и NOT NULL упёрся бы в уже лежащие
  // строки — как было с password_digest.
  phone: text("phone"),
  ...timestamps,
});

export const courses = pgTable("courses", {
  id,
  name: text("name").notNull(),
  // Запрет, а не каскад: курс не перестаёт существовать от того, что автор
  // ушёл. Что делать с осиротевшими курсами — решение приложения, и оно
  // отвечает 409, а не молча сносит данные из миграции.
  creatorId: integer("creator_id")
    .references(() => users.id, { onDelete: "restrict" })
    .notNull(),
  description: text("description").notNull(),
  ...timestamps,
});

export const courseLessons = pgTable("course_lessons", {
  id,
  name: text("name").notNull(),
  // Тоже запрет, хотя урок вне курса не существует: удаление уроков делает
  // обработчик в транзакции. Поведение видно в коде, а не только в миграции.
  courseId: integer("courseId")
    .references(() => courses.id, { onDelete: "restrict" })
    .notNull(),
  body: text("body").notNull(),
  ...timestamps,
});
