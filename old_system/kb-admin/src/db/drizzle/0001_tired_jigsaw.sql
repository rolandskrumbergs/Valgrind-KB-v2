CREATE TYPE "public"."courses_currency" AS ENUM('EUR', 'SEK');--> statement-breakpoint
CREATE TYPE "public"."courses_source" AS ENUM('user', 'customer');--> statement-breakpoint
CREATE TABLE "course_purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"transaction_id" text NOT NULL,
	"price" integer NOT NULL,
	"currency" "courses_currency" DEFAULT 'SEK' NOT NULL,
	"purchased_by" text NOT NULL,
	"source" "courses_source" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "currency" "courses_currency" DEFAULT 'SEK' NOT NULL;--> statement-breakpoint
ALTER TABLE "course_purchases" ADD CONSTRAINT "course_purchases_course_id_courses_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("course_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_uuid_unique" UNIQUE("uuid");