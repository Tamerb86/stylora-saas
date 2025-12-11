ALTER TABLE `orderItems` MODIFY COLUMN `quantity` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `orderItems` MODIFY COLUMN `vatRate` decimal(5,2) NOT NULL DEFAULT '25.00';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `employeeId` int;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `vatAmount` decimal(10,2) NOT NULL DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `status` enum('pending','completed','refunded') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `createdAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `payments` MODIFY COLUMN `status` enum('pending','completed','refunded') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `orderItems` ADD `itemName` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `orderItems` ADD `total` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `orderItems` ADD `createdAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `orders` ADD `total` decimal(10,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `orderItems` DROP COLUMN `lineTotal`;--> statement-breakpoint
ALTER TABLE `orders` DROP COLUMN `totalAmount`;