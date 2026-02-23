DROP TABLE "user_invitations" CASCADE;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "invited" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "invitation_accepted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "invitation_accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "requires_invitation_password_reset";