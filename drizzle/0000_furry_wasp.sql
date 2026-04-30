CREATE TABLE IF NOT EXISTS `account` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`userId` text(255) NOT NULL,
	`accountId` text(255) NOT NULL,
	`providerId` text(255) NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text(255),
	`idToken` text,
	`password` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `account_user_id_idx` ON `account` (`userId`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `finmaxxing_allocation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text(255) NOT NULL,
	`investmentId` integer NOT NULL,
	`goalId` integer NOT NULL,
	`percentage` real NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`investmentId`) REFERENCES `finmaxxing_investment`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`goalId`) REFERENCES `finmaxxing_goal`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "allocation_percentage_range" CHECK("finmaxxing_allocation"."percentage" > 0 AND "finmaxxing_allocation"."percentage" <= 1)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `allocation_user_id_idx` ON `finmaxxing_allocation` (`userId`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `allocation_investment_id_idx` ON `finmaxxing_allocation` (`investmentId`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `allocation_goal_id_idx` ON `finmaxxing_allocation` (`goalId`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `allocation_investment_goal_idx` ON `finmaxxing_allocation` (`investmentId`,`goalId`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `finmaxxing_goal` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text(255) NOT NULL,
	`name` text(255) NOT NULL,
	`targetAmountMinor` integer NOT NULL,
	`targetYear` integer NOT NULL,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "target_amount_minor_positive" CHECK("finmaxxing_goal"."targetAmountMinor" > 0),
	CONSTRAINT "target_year_positive" CHECK("finmaxxing_goal"."targetYear" > 0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `goal_user_id_idx` ON `finmaxxing_goal` (`userId`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `goal_user_name_idx` ON `finmaxxing_goal` (`userId`,`name`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `finmaxxing_investment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text(255) NOT NULL,
	`name` text(255) NOT NULL,
	`tickerSymbol` text(64) NOT NULL,
	`isin` text(32),
	`category` text(128),
	`monthlySipMinor` integer DEFAULT 0 NOT NULL,
	`currentNav` real,
	`navUpdatedAt` integer,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "monthly_sip_minor_non_negative" CHECK("finmaxxing_investment"."monthlySipMinor" >= 0),
	CONSTRAINT "current_nav_positive" CHECK("finmaxxing_investment"."currentNav" IS NULL OR "finmaxxing_investment"."currentNav" > 0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `investment_user_id_idx` ON `finmaxxing_investment` (`userId`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `investment_ticker_symbol_idx` ON `finmaxxing_investment` (`tickerSymbol`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `investment_user_ticker_symbol_idx` ON `finmaxxing_investment` (`userId`,`tickerSymbol`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `finmaxxing_portfolio_assumption` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text(255) NOT NULL,
	`currentYear` integer NOT NULL,
	`inflationRate` real DEFAULT 0.06 NOT NULL,
	`expectedReturnRate` real DEFAULT 0.1 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "inflation_rate_non_negative" CHECK("finmaxxing_portfolio_assumption"."inflationRate" >= 0),
	CONSTRAINT "expected_return_rate_non_negative" CHECK("finmaxxing_portfolio_assumption"."expectedReturnRate" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `portfolio_assumption_user_id_idx` ON `finmaxxing_portfolio_assumption` (`userId`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `session` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`userId` text(255) NOT NULL,
	`token` text(255) NOT NULL,
	`expiresAt` integer NOT NULL,
	`ipAddress` text(255),
	`userAgent` text(255),
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `session_user_id_idx` ON `session` (`userId`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `finmaxxing_transaction` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text(255) NOT NULL,
	`investmentId` integer NOT NULL,
	`transactionDate` integer NOT NULL,
	`type` text NOT NULL,
	`amountMinor` integer NOT NULL,
	`units` real NOT NULL,
	`nav` real NOT NULL,
	`notes` text(1024),
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`investmentId`) REFERENCES `finmaxxing_investment`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "transaction_type_valid" CHECK("finmaxxing_transaction"."type" IN ('buy', 'sell')),
	CONSTRAINT "transaction_amount_minor_positive" CHECK("finmaxxing_transaction"."amountMinor" > 0),
	CONSTRAINT "transaction_units_positive" CHECK("finmaxxing_transaction"."units" > 0),
	CONSTRAINT "transaction_nav_positive" CHECK("finmaxxing_transaction"."nav" > 0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `transaction_user_id_idx` ON `finmaxxing_transaction` (`userId`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `transaction_investment_id_idx` ON `finmaxxing_transaction` (`investmentId`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `transaction_date_idx` ON `finmaxxing_transaction` (`transactionDate`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`name` text(255),
	`email` text(255) NOT NULL,
	`emailVerified` integer DEFAULT false,
	`image` text(255),
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `verification` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`identifier` text(255) NOT NULL,
	`value` text(255) NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `verification_identifier_idx` ON `verification` (`identifier`);
