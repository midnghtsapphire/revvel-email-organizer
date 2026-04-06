-- Migration: Add password_hashes, synced_emails, and organize_jobs tables

CREATE TABLE IF NOT EXISTS `password_hashes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `openId` varchar(64) NOT NULL,
  `hash` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `password_hashes_id` PRIMARY KEY(`id`),
  CONSTRAINT `password_hashes_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `synced_emails` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `gmailAccountId` int NOT NULL,
  `messageId` varchar(255) NOT NULL,
  `threadId` varchar(255),
  `from` varchar(500),
  `fromName` varchar(255),
  `fromEmail` varchar(320),
  `to` text,
  `subject` varchar(1000),
  `snippet` text,
  `labelIds` json,
  `category` varchar(50),
  `priority` enum('high','medium','low') DEFAULT 'medium',
  `sentiment` enum('positive','neutral','negative') DEFAULT 'neutral',
  `isRead` boolean NOT NULL DEFAULT false,
  `isStarred` boolean NOT NULL DEFAULT false,
  `isArchived` boolean NOT NULL DEFAULT false,
  `isTrashed` boolean NOT NULL DEFAULT false,
  `hasUnsubscribe` boolean DEFAULT false,
  `unsubscribeUrl` text,
  `internalDate` varchar(20),
  `receivedAt` timestamp,
  `syncedAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `synced_emails_id` PRIMARY KEY(`id`),
  UNIQUE KEY `synced_emails_userId_messageId_unique` (`userId`, `messageId`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `organize_jobs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `gmailAccountId` int NOT NULL,
  `status` enum('queued','running','completed','failed') NOT NULL DEFAULT 'queued',
  `jobType` enum('sync','organize','bulk_action') NOT NULL DEFAULT 'organize',
  `processed` int NOT NULL DEFAULT 0,
  `total` int NOT NULL DEFAULT 0,
  `errorCount` int NOT NULL DEFAULT 0,
  `categoryCounts` json,
  `options` json,
  `errorMessage` text,
  `startedAt` timestamp,
  `completedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `organize_jobs_id` PRIMARY KEY(`id`)
);
