CREATE TABLE `accounts` (
	`id` BINARY(16) NOT NULL,
	`user_id` BINARY(16) NOT NULL,
	`plan_id` varchar(64) NOT NULL,
	`name` varchar(64) NOT NULL,
	`opened_on` date NOT NULL,
	`starting_balance_cents` bigint NOT NULL,
	`profit_target_cents` bigint NOT NULL,
	`trailing_drawdown_cents` bigint NOT NULL,
	`daily_loss_limit_cents` bigint NOT NULL,
	`lock_above_start_cents` bigint NOT NULL,
	`max_minis` smallint unsigned NOT NULL,
	`max_micros` smallint unsigned NOT NULL,
	`peak_equity_cents` bigint NOT NULL,
	`ended_at` timestamp,
	`ended_reason` enum('daily_loss','trailing_drawdown','target_met'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fills` (
	`id` BINARY(16) NOT NULL,
	`account_id` BINARY(16) NOT NULL,
	`order_id` BINARY(16) NOT NULL,
	`trade_date` date NOT NULL,
	`instrument` varchar(16) NOT NULL,
	`side` enum('buy','sell') NOT NULL,
	`quantity` smallint unsigned NOT NULL,
	`price` bigint NOT NULL,
	`at` datetime(3) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` BINARY(16) NOT NULL,
	`account_id` BINARY(16) NOT NULL,
	`trade_date` date NOT NULL,
	`instrument` varchar(16) NOT NULL,
	`side` enum('buy','sell') NOT NULL,
	`type` enum('market','limit','stop') NOT NULL,
	`intent` enum('trade','stop_loss','take_profit') NOT NULL,
	`quantity` smallint unsigned NOT NULL,
	`price` bigint,
	`parent_order_id` BINARY(16),
	`replaces_order_id` BINARY(16),
	`placed_at` datetime(3) NOT NULL,
	`ended_at` datetime(3),
	`ended_reason` enum('cancelled','replaced','expired'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trading_days` (
	`id` BINARY(16) NOT NULL,
	`account_id` BINARY(16) NOT NULL,
	`trade_date` date NOT NULL,
	`opened_at` datetime(3) NOT NULL,
	`open_equity_cents` bigint NOT NULL,
	`low_equity_cents` bigint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trading_days_id` PRIMARY KEY(`id`),
	CONSTRAINT `account_id_trade_date_unique` UNIQUE(`account_id`,`trade_date`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `username_unique` UNIQUE(`username`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `account_id_at_idx` ON `fills` (`account_id`,`at`);--> statement-breakpoint
CREATE INDEX `account_id_trade_date_idx` ON `fills` (`account_id`,`trade_date`);--> statement-breakpoint
CREATE INDEX `order_id_idx` ON `fills` (`order_id`);--> statement-breakpoint
CREATE INDEX `account_id_trade_date_idx` ON `orders` (`account_id`,`trade_date`);--> statement-breakpoint
CREATE INDEX `parent_order_id_idx` ON `orders` (`parent_order_id`);