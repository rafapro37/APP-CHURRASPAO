CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`emoji` varchar(8),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`type` enum('percent','fixed') NOT NULL DEFAULT 'percent',
	`value` double NOT NULL,
	`maxDiscount` double,
	`minOrderValue` double NOT NULL DEFAULT 0,
	`usageLimit` int,
	`usedCount` int NOT NULL DEFAULT 0,
	`onePerCustomer` boolean NOT NULL DEFAULT true,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(16) NOT NULL,
	`userId` int,
	`guestName` varchar(128),
	`customerName` varchar(128) NOT NULL,
	`customerPhone` varchar(32) NOT NULL,
	`deliveryType` enum('delivery','pickup') NOT NULL DEFAULT 'delivery',
	`addressLine` varchar(512),
	`addressRef` varchar(256),
	`paymentMethod` enum('pix','card','cash','online') NOT NULL DEFAULT 'pix',
	`changeFor` varchar(32),
	`couponCode` varchar(64),
	`couponDiscount` double NOT NULL DEFAULT 0,
	`subtotal` double NOT NULL,
	`deliveryFee` double NOT NULL DEFAULT 0,
	`total` double NOT NULL,
	`status` enum('new','accepted','preparing','ready','delivering','finished','cancelled') NOT NULL DEFAULT 'new',
	`observation` text,
	`itemsJson` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `productAccompaniments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`label` varchar(256) NOT NULL,
	`optionsJson` json NOT NULL,
	`minSelection` int NOT NULL DEFAULT 0,
	`maxSelection` int NOT NULL DEFAULT 0,
	`isRequired` boolean NOT NULL DEFAULT false,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productAccompaniments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productAddons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`price` double NOT NULL DEFAULT 0,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productAddons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`url` varchar(512) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productImages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productVariations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`price` double NOT NULL DEFAULT 0,
	`isDefault` boolean NOT NULL DEFAULT false,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productVariations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`shortDescription` text,
	`categoryId` int NOT NULL,
	`price` double NOT NULL,
	`promoPrice` double,
	`status` enum('available','unavailable','soldOut') NOT NULL DEFAULT 'available',
	`isBestSeller` boolean NOT NULL DEFAULT false,
	`isNew` boolean NOT NULL DEFAULT false,
	`isOffer` boolean NOT NULL DEFAULT false,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`isExclusive` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promotions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`subtitle` varchar(256),
	`imageUrl` varchar(512),
	`productId` int,
	`originalPrice` double,
	`promoPrice` double,
	`dayOfWeek` int,
	`startHour` varchar(5),
	`endHour` varchar(5),
	`startDate` timestamp,
	`endDate` timestamp,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `promotions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `loyaltyPoints` int DEFAULT 0 NOT NULL;