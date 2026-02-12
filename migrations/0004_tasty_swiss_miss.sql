CREATE TABLE `navigation_configs` (
	`locale` text PRIMARY KEY NOT NULL,
	`items` text DEFAULT '[]' NOT NULL,
	`updated_at` integer NOT NULL
);
