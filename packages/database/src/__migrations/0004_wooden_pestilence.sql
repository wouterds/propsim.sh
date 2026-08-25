CREATE TABLE `email_logs` (
	`id` BINARY(16) NOT NULL,
	`recipient` varchar(255) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`template` varchar(32) NOT NULL,
	`payload` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `recipient_idx` ON `email_logs` (`recipient`);