ALTER TABLE "chat_tokens_purchases" ALTER COLUMN "currency" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "chat_tokens_purchases" ALTER COLUMN "currency" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "course_purchases" ALTER COLUMN "currency" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "course_purchases" ALTER COLUMN "currency" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "courses" ALTER COLUMN "currency" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "courses" ALTER COLUMN "currency" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "chat_tokens_purchases" ADD COLUMN "price_in_purchased_currency" numeric(10, 3);--> statement-breakpoint
ALTER TABLE "course_purchases" ADD COLUMN "price_in_purchased_currency" numeric(10, 3);--> statement-breakpoint
DROP TYPE "public"."courses_currency";