CREATE TABLE "user_invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expiration_time" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;