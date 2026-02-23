ALTER TABLE "public"."user" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."user_roles";--> statement-breakpoint
CREATE TYPE "public"."user_roles" AS ENUM('admin', 'user');--> statement-breakpoint
ALTER TABLE "public"."user" ALTER COLUMN "role" SET DATA TYPE "public"."user_roles" USING "role"::"public"."user_roles";