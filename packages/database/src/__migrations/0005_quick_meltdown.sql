DROP INDEX `user_id_idx` ON `sessions`;--> statement-breakpoint
ALTER TABLE `users` ADD `inactivity_notice` enum('warn','final');--> statement-breakpoint
CREATE INDEX `user_id_last_seen_idx` ON `sessions` (`user_id`,`last_seen_at`);--> statement-breakpoint
CREATE INDEX `deleted_at_idx` ON `users` (`deleted_at`);