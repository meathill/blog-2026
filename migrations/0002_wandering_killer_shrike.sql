CREATE TABLE `app_translations` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`locale` text NOT NULL,
	`name` text,
	`description` text,
	`content` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `app_translations_app_id_locale_unique` ON `app_translations` (`app_id`,`locale`);