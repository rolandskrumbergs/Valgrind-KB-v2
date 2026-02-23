CREATE TYPE "public"."courses_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."document_category" AS ENUM('books', 'laws', 'legalcases', 'other');--> statement-breakpoint
CREATE TYPE "public"."news_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."processing_status" AS ENUM('uploaded', 'downloading', 'partitioning', 'cleaning', 'chunking', 'embedding', 'indexing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."questions_type" AS ENUM('multiple_choice');--> statement-breakpoint
CREATE TYPE "public"."user_courses_access_type" AS ENUM('free', 'purchase', 'organization');--> statement-breakpoint
CREATE TYPE "public"."user_courses_status" AS ENUM('not_started', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."user_roles" AS ENUM('admin', 'owner', 'manager', 'customer', 'user');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapters" (
	"chapter_id" serial PRIMARY KEY NOT NULL,
	"course_id" integer,
	"title" text NOT NULL,
	"description" text,
	"video_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp NOT NULL,
	"title" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"course_id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_url" text,
	"price" integer DEFAULT 0 NOT NULL,
	"status" "courses_status" DEFAULT 'draft' NOT NULL,
	"creator_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_courses" (
	"customer_id" uuid NOT NULL,
	"course_id" integer,
	"shared_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"contact_info" text NOT NULL,
	"invoice_info" text NOT NULL,
	"licenses" integer NOT NULL,
	"users" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ibben_lena_knowledge_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_type" text NOT NULL,
	"category" "document_category" NOT NULL,
	"s3_key" text NOT NULL,
	"s3_url" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"file_hash" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"user_name" text,
	"user_role" text,
	"processing_status" "processing_status" DEFAULT 'uploaded' NOT NULL,
	"current_stage_progress" json,
	"error_message" text,
	"total_chunks" integer,
	"total_indexed_chunks" integer,
	"total_failed_chunks" integer,
	"processing_time" json,
	"chunk_metrics" json,
	"embedding_results" json,
	"indexing_results" json,
	"processing_message" text,
	"chunk_set" text DEFAULT 'set_a',
	CONSTRAINT "ibben_lena_knowledge_files_file_hash_unique" UNIQUE("file_hash")
);
--> statement-breakpoint
CREATE TABLE "knowledge_base_invocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" text NOT NULL,
	"chat_id" text NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"search_query" text NOT NULL,
	"conversation_summary" text NOT NULL,
	"result" text NOT NULL,
	"status" text NOT NULL,
	"type" text,
	"fetched_chunks" json NOT NULL,
	"metrics" json NOT NULL,
	"created_at" timestamp NOT NULL,
	"input_tokens" integer NOT NULL,
	"output_tokens" integer NOT NULL,
	"model" text NOT NULL,
	"lena_profile" json
);
--> statement-breakpoint
CREATE TABLE "lena_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"profile_name" text,
	"top_k" integer NOT NULL,
	"model" text NOT NULL,
	"threshold" integer NOT NULL,
	"threshold_required_chunks" integer NOT NULL,
	"high_confidence_threshold" integer NOT NULL,
	"required_high_confidence_chunks" integer NOT NULL,
	"created_at" timestamp NOT NULL,
	"created_by" text,
	"created_by_name" text NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"updated_by" text,
	"updated_by_name" text NOT NULL,
	CONSTRAINT "lena_profiles_profile_name_unique" UNIQUE("profile_name")
);
--> statement-breakpoint
CREATE TABLE "lena_starter_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "licenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"user_id" text,
	"personal_number" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"activated" boolean DEFAULT true NOT NULL,
	CONSTRAINT "licenses_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid NOT NULL,
	"role" varchar NOT NULL,
	"parts" json NOT NULL,
	"created_at" timestamp NOT NULL,
	"lena_profile" json
);
--> statement-breakpoint
CREATE TABLE "news" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"featured_image" text,
	"pdf_files" json DEFAULT '[]'::json,
	"excluded_customers" json DEFAULT '[]'::json,
	"status" "news_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_name" text,
	"user_role" text
);
--> statement-breakpoint
CREATE TABLE "question_options" (
	"option_id" serial PRIMARY KEY NOT NULL,
	"question_id" integer,
	"text" text NOT NULL,
	"is_correct" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"question_id" serial PRIMARY KEY NOT NULL,
	"chapter_id" integer,
	"type" "questions_type" DEFAULT 'multiple_choice' NOT NULL,
	"text" text NOT NULL,
	"description" text,
	"feedback" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "token_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid,
	"message_id" uuid,
	"prompt_tokens" integer NOT NULL,
	"completion_tokens" integer NOT NULL,
	"total_tokens" integer NOT NULL,
	"created_at" timestamp NOT NULL,
	"model" text,
	"lena_profile" json,
	"user_id" text
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"role" "user_roles" NOT NULL,
	"banned" boolean,
	"ban_reason" text,
	"ban_expires" timestamp,
	"username" text,
	"display_username" text,
	"customer_id" uuid,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "user_courses" (
	"user_id" text,
	"course_id" integer,
	"last_chapter_id" integer,
	"customer_id" uuid,
	"status" "user_courses_status" DEFAULT 'not_started' NOT NULL,
	"access_type" "user_courses_access_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_courses_user_id_course_id_pk" PRIMARY KEY("user_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "user_question_answers" (
	"user_id" text,
	"question_id" integer,
	"option_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_question_answers_user_id_question_id_pk" PRIMARY KEY("user_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "vote" (
	"chat_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"is_upvoted" boolean NOT NULL,
	CONSTRAINT "vote_chat_id_message_id_pk" PRIMARY KEY("chat_id","message_id")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_course_id_courses_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("course_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat" ADD CONSTRAINT "chat_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_courses" ADD CONSTRAINT "customer_courses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_courses" ADD CONSTRAINT "customer_courses_course_id_courses_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("course_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_courses" ADD CONSTRAINT "customer_courses_shared_by_user_id_user_id_fk" FOREIGN KEY ("shared_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lena_profiles" ADD CONSTRAINT "lena_profiles_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lena_profiles" ADD CONSTRAINT "lena_profiles_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_chapter_id_chapters_chapter_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("chapter_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_courses" ADD CONSTRAINT "user_courses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_courses" ADD CONSTRAINT "user_courses_course_id_courses_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("course_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_courses" ADD CONSTRAINT "user_courses_last_chapter_id_chapters_chapter_id_fk" FOREIGN KEY ("last_chapter_id") REFERENCES "public"."chapters"("chapter_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_courses" ADD CONSTRAINT "user_courses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_question_answers" ADD CONSTRAINT "user_question_answers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_question_answers" ADD CONSTRAINT "user_question_answers_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("question_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_question_answers" ADD CONSTRAINT "user_question_answers_option_id_question_options_option_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."question_options"("option_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote" ADD CONSTRAINT "vote_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote" ADD CONSTRAINT "vote_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE no action ON UPDATE no action;