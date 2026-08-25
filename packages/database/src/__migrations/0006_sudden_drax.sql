CREATE TABLE `feature_comments` (
	`id` BINARY(16) NOT NULL,
	`feature_id` BINARY(16) NOT NULL,
	`parent_id` BINARY(16),
	`user_id` BINARY(16) NOT NULL,
	`body` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feature_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feature_requests` (
	`id` BINARY(16) NOT NULL,
	`user_id` BINARY(16) NOT NULL,
	`title` varchar(120) NOT NULL,
	`description` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feature_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feature_votes` (
	`id` BINARY(16) NOT NULL,
	`subject` enum('request','comment') NOT NULL,
	`subject_id` BINARY(16) NOT NULL,
	`user_id` BINARY(16) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feature_votes_id` PRIMARY KEY(`id`),
	CONSTRAINT `subject_unique` UNIQUE(`subject`,`subject_id`,`user_id`)
);
--> statement-breakpoint
CREATE INDEX `feature_id_idx` ON `feature_comments` (`feature_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `feature_requests` (`user_id`);--> statement-breakpoint
CREATE INDEX `subject_user_idx` ON `feature_votes` (`subject`,`user_id`);