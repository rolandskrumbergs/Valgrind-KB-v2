CREATE TABLE "chat_tokens_purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"price" integer NOT NULL,
	"currency" "courses_currency" DEFAULT 'SEK' NOT NULL,
	"type" text NOT NULL,
	"transaction_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_purchases" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "course_purchases" ADD COLUMN "type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "purchased_chat_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_tokens_purchases" ADD CONSTRAINT "chat_tokens_purchases_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_purchases" ADD CONSTRAINT "course_purchases_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_purchases" DROP COLUMN "purchased_by";--> statement-breakpoint
ALTER TABLE "course_purchases" DROP COLUMN "source";--> statement-breakpoint
DROP TYPE "public"."courses_source";