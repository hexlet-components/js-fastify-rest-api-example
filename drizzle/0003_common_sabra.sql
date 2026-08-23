PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_course_lessons` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`courseId` integer NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_course_lessons`("id", "name", "courseId", "body", "created_at", "updated_at") SELECT "id", "name", "courseId", "body", "created_at", "updated_at" FROM `course_lessons`;--> statement-breakpoint
DROP TABLE `course_lessons`;--> statement-breakpoint
ALTER TABLE `__new_course_lessons` RENAME TO `course_lessons`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_courses` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`creator_id` integer NOT NULL,
	`description` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_courses`("id", "name", "creator_id", "description", "created_at", "updated_at") SELECT "id", "name", "creator_id", "description", "created_at", "updated_at" FROM `courses`;--> statement-breakpoint
DROP TABLE `courses`;--> statement-breakpoint
ALTER TABLE `__new_courses` RENAME TO `courses`;