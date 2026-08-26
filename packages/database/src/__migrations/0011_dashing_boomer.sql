ALTER TABLE `users` ADD `twitter` varchar(40);--> statement-breakpoint
ALTER TABLE `users` ADD `youtube` varchar(40);--> statement-breakpoint
ALTER TABLE `users` ADD `twitch` varchar(40);--> statement-breakpoint
ALTER TABLE `users` ADD `shows_accounts` boolean DEFAULT false NOT NULL;