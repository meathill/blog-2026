CREATE TABLE `blog_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`excerpt` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`cover_image` text,
	`categories` text DEFAULT '[]' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`blocks_json` text NOT NULL,
	`markdown` text NOT NULL,
	`html` text NOT NULL,
	`wp_post_id` integer,
	`wp_synced_at` integer,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
CREATE UNIQUE INDEX `blog_posts_slug_unique` ON `blog_posts` (`slug`);
