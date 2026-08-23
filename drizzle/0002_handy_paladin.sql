-- Пересоздание таблиц под таймстемпы: created_at из text в integer, updated_at
-- добавлен и стал NOT NULL.
--
-- SELECT'ы поправлены руками. drizzle-kit сгенерировал перенос updated_at из
-- courses и course_lessons, где такой колонки никогда не было, — миграция
-- падала с «no such column: updated_at». Для них updated_at заполняется из
-- created_at, для users — из старого значения, если оно было.
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_course_lessons` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`courseId` integer NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_course_lessons`("id", "name", "courseId", "body", "created_at", "updated_at") SELECT "id", "name", "courseId", "body", CAST("created_at" AS integer), CAST("created_at" AS integer) FROM `course_lessons`;--> statement-breakpoint
DROP TABLE `course_lessons`;--> statement-breakpoint
ALTER TABLE `__new_course_lessons` RENAME TO `course_lessons`;--> statement-breakpoint
CREATE TABLE `__new_courses` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`creator_id` integer NOT NULL,
	`description` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_courses`("id", "name", "creator_id", "description", "created_at", "updated_at") SELECT "id", "name", "creator_id", "description", CAST("created_at" AS integer), CAST("created_at" AS integer) FROM `courses`;--> statement-breakpoint
DROP TABLE `courses`;--> statement-breakpoint
ALTER TABLE `__new_courses` RENAME TO `courses`;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` integer PRIMARY KEY NOT NULL,
	`full_name` text,
	`email` text NOT NULL,
	`password_digest` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "full_name", "email", "password_digest", "created_at", "updated_at") SELECT "id", "full_name", "email", "password_digest", CAST("created_at" AS integer), COALESCE(CAST("updated_at" AS integer), CAST("created_at" AS integer)) FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
