ALTER TABLE "user_courses" ADD COLUMN "certificate_id" text;--> statement-breakpoint
ALTER TABLE "user_courses" ADD CONSTRAINT "user_courses_certificate_id_unique" UNIQUE("certificate_id");--> statement-breakpoint
UPDATE "user_courses" SET "certificate_id" = SUBSTRING(md5(random()::text || clock_timestamp()::text) FROM 1 FOR 9) WHERE "status" = 'completed' AND "certificate_id" IS NULL;