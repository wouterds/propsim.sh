DROP INDEX `order_id_idx` ON `fills`;--> statement-breakpoint
ALTER TABLE `fills` ADD CONSTRAINT `order_id_unique` UNIQUE(`order_id`);