CREATE TABLE `email_changes` (
	`id` BINARY(16) NOT NULL,
	`user_id` BINARY(16) NOT NULL,
	`email` varchar(255) NOT NULL,
	`hash` varchar(64) NOT NULL,
	`expires_at` datetime NOT NULL,
	`consumed_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_changes_id` PRIMARY KEY(`id`),
	CONSTRAINT `hash_unique` UNIQUE(`hash`),
	CONSTRAINT `user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `password_resets` (
	`id` BINARY(16) NOT NULL,
	`user_id` BINARY(16) NOT NULL,
	`hash` varchar(64) NOT NULL,
	`expires_at` datetime NOT NULL,
	`consumed_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `password_resets_id` PRIMARY KEY(`id`),
	CONSTRAINT `hash_unique` UNIQUE(`hash`),
	CONSTRAINT `user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` BINARY(16) NOT NULL,
	`user_id` BINARY(16) NOT NULL,
	`hash` varchar(64) NOT NULL,
	`user_agent` varchar(512),
	`browser` varchar(32),
	`os` varchar(32),
	`kind` varchar(16),
	`ip` varchar(45),
	`country` char(2),
	`last_seen_at` datetime NOT NULL,
	`expires_at` datetime NOT NULL,
	`revoked_at` datetime,
	`revoked_reason` enum('logout','revoked','password_change','password_reset','email_change'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `hash_unique` UNIQUE(`hash`)
);
--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `sessions` (`user_id`);