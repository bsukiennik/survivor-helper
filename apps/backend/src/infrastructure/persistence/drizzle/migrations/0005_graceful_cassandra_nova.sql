CREATE TYPE "public"."employer_verification_status" AS ENUM('pending', 'verified');--> statement-breakpoint
CREATE TABLE "employer_profiles" (
	"account_id" uuid PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"verification_status" "employer_verification_status" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employer_profiles" ADD CONSTRAINT "employer_profiles_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;