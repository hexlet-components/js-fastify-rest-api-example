CREATE TABLE `course_lessons` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text,
	`courseId` integer NOT NULL,
	`body` text NOT NULL,
	`created_at` text DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text,
	`creator_id` integer,
	`description` text NOT NULL,
	`created_at` text DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`full_name` text,
	`email` text NOT NULL,
	`updated_at` text,
	`created_at` text DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);