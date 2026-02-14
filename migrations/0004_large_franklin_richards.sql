CREATE TABLE `about_contents` (
	`locale` text PRIMARY KEY NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`github_content` text DEFAULT '' NOT NULL,
	`sponsor_content` text DEFAULT '' NOT NULL,
	`updated_at` integer NOT NULL
);
