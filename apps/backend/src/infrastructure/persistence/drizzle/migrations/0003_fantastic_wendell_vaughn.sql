CREATE TABLE "job_seeker_profiles" (
	"account_id" uuid PRIMARY KEY NOT NULL,
	"skills" text NOT NULL,
	"experience" text NOT NULL,
	"availability" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_seeker_profiles" ADD CONSTRAINT "job_seeker_profiles_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;