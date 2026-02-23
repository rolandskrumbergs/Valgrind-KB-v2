ALTER TABLE "licenses" DROP CONSTRAINT "licenses_email_unique";--> statement-breakpoint
ALTER TABLE "licenses" DROP COLUMN "personal_number";--> statement-breakpoint
ALTER TABLE "licenses" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "licenses" DROP COLUMN "name";