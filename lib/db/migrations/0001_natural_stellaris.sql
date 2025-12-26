CREATE SCHEMA "flashcards";
--> statement-breakpoint
CREATE TYPE "flashcards"."learning_mode" AS ENUM('pl_to_en_text', 'en_to_pl_text', 'pl_to_en_quiz', 'en_to_pl_quiz');--> statement-breakpoint
CREATE TYPE "flashcards"."level" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1');--> statement-breakpoint
CREATE TYPE "flashcards"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "flashcards"."accounts" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "flashcards"."achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"type" text NOT NULL,
	"level" text,
	"category" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flashcards"."app_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_email" varchar(255) DEFAULT 'kontakt@flashcards.pl' NOT NULL,
	"email_notifications_enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "flashcards"."contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"email_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flashcards"."custom_words" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"english" text NOT NULL,
	"polish" text NOT NULL,
	"level" "flashcards"."level" NOT NULL,
	"category" text NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flashcards"."learning_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"word_english" text NOT NULL,
	"word_polish" text NOT NULL,
	"is_correct" boolean NOT NULL,
	"learning_mode" "flashcards"."learning_mode" NOT NULL,
	"level" "flashcards"."level" NOT NULL,
	"category" text NOT NULL,
	"time_spent_ms" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flashcards"."sessions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "flashcards"."user_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"total_words_learned" integer DEFAULT 0 NOT NULL,
	"total_sessions" integer DEFAULT 0 NOT NULL,
	"total_time_ms" integer DEFAULT 0 NOT NULL,
	"last_active_date" date,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_stats_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "flashcards"."users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"password" text,
	"role" "flashcards"."user_role" DEFAULT 'user' NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "flashcards"."verification_tokens" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "flashcards"."word_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"word_english" text NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"easiness_factor" real DEFAULT 2.5 NOT NULL,
	"interval" integer DEFAULT 0 NOT NULL,
	"next_review_date" timestamp,
	"last_reviewed" timestamp,
	"difficulty_rating" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flashcards"."words" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"english" text NOT NULL,
	"polish" text NOT NULL,
	"level" "flashcards"."level" NOT NULL,
	"category" text NOT NULL,
	"image_url" text,
	"created_by" varchar(255),
	"is_approved" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "accounts" CASCADE;--> statement-breakpoint
DROP TABLE "achievements" CASCADE;--> statement-breakpoint
DROP TABLE "custom_words" CASCADE;--> statement-breakpoint
DROP TABLE "learning_sessions" CASCADE;--> statement-breakpoint
DROP TABLE "sessions" CASCADE;--> statement-breakpoint
DROP TABLE "user_stats" CASCADE;--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
DROP TABLE "verification_tokens" CASCADE;--> statement-breakpoint
DROP TABLE "word_progress" CASCADE;--> statement-breakpoint
DROP TABLE "words" CASCADE;--> statement-breakpoint
ALTER TABLE "flashcards"."accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "flashcards"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcards"."achievements" ADD CONSTRAINT "achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "flashcards"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcards"."app_settings" ADD CONSTRAINT "app_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "flashcards"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcards"."custom_words" ADD CONSTRAINT "custom_words_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "flashcards"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcards"."learning_sessions" ADD CONSTRAINT "learning_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "flashcards"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcards"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "flashcards"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcards"."user_stats" ADD CONSTRAINT "user_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "flashcards"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcards"."word_progress" ADD CONSTRAINT "word_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "flashcards"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcards"."words" ADD CONSTRAINT "words_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "flashcards"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "words_level_idx" ON "flashcards"."words" USING btree ("level");--> statement-breakpoint
CREATE INDEX "words_category_idx" ON "flashcards"."words" USING btree ("category");--> statement-breakpoint
CREATE INDEX "words_approved_idx" ON "flashcards"."words" USING btree ("is_approved");--> statement-breakpoint
CREATE INDEX "words_english_idx" ON "flashcards"."words" USING btree ("english");--> statement-breakpoint
DROP TYPE "public"."learning_mode";--> statement-breakpoint
DROP TYPE "public"."level";--> statement-breakpoint
DROP TYPE "public"."user_role";