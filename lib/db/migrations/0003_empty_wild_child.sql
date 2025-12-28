CREATE TABLE "flashcards"."sso_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_key" text NOT NULL,
	"project_slug" varchar(255) NOT NULL,
	"center_url" text NOT NULL,
	"project_name" text,
	"configured_at" timestamp DEFAULT now() NOT NULL,
	"configured_by" varchar(255)
);
--> statement-breakpoint
ALTER TABLE "flashcards"."sso_config" ADD CONSTRAINT "sso_config_configured_by_users_id_fk" FOREIGN KEY ("configured_by") REFERENCES "flashcards"."users"("id") ON DELETE set null ON UPDATE no action;