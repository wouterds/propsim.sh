CREATE TABLE `email_verifications` (
	`id` BINARY(16) NOT NULL,
	`user_id` BINARY(16) NOT NULL,
	`hash` varchar(255) NOT NULL,
	`attempts` tinyint unsigned NOT NULL DEFAULT 0,
	`expires_at` datetime NOT NULL,
	`consumed_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_verifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` BINARY(16) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`verified_email_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_unique` UNIQUE(`email`)
);
