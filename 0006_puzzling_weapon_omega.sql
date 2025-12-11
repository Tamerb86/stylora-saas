	`id` int AUTO_INCREMENT NOT NULL,
	`appointmentId` int NOT NULL,
	`serviceId` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	CONSTRAINT `appointmentServices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`customerId` int NOT NULL,
	`employeeId` int NOT NULL,
	`appointmentDate` date NOT NULL,
	`startTime` time NOT NULL,
	`endTime` time NOT NULL,
	`status` enum('pending','confirmed','completed','canceled','no_show') DEFAULT 'pending',
	`cancellationReason` text,
	`canceledBy` enum('customer','staff','system'),
	`canceledAt` timestamp,
	`isLateCancellation` boolean DEFAULT false,
	`notes` text,
	`recurrenceRuleId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`userId` int,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int NOT NULL,
	`beforeValue` json,
	`afterValue` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bulkCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('sms','email') NOT NULL,
	`templateId` int,
	`subject` varchar(255),