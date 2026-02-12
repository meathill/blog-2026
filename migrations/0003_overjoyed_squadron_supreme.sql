CREATE TABLE `notion_post_backups` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`status` text NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`categories` text DEFAULT '[]' NOT NULL,
	`date` text,
	`content` text NOT NULL,
	`cover_image` text,
	`last_update_time` integer NOT NULL,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
