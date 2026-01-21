CREATE TABLE `app_images` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`url` text NOT NULL,
	`alt` text,
	`type` text DEFAULT 'screenshot',
	`sort_order` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `app_tags` (
	`app_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`app_id`, `tag_id`),
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `tags_slug_unique` ON `tags` (`slug`);--> statement-breakpoint
ALTER TABLE `apps` ADD `content` text;--> statement-breakpoint
ALTER TABLE `apps` ADD `repo_url` text;--> statement-breakpoint
ALTER TABLE `apps` ADD `published_at` integer;