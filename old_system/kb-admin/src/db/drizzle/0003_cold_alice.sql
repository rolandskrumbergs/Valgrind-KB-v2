ALTER TABLE "chat_tokens_purchases" ALTER COLUMN "price" SET DATA TYPE numeric(10, 3);--> statement-breakpoint
ALTER TABLE "chat_tokens_purchases" ALTER COLUMN "price" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "course_purchases" ALTER COLUMN "price" SET DATA TYPE numeric(10, 3);--> statement-breakpoint
ALTER TABLE "course_purchases" ALTER COLUMN "price" DROP NOT NULL;