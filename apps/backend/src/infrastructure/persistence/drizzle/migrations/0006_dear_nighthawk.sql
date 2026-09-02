-- Pre-existing listings (from any prior seed run) have no employer_id or
-- distribution_radius_km — there is no sensible value to backfill them
-- with, and they are all seed/test data. Delete them so the NOT NULL
-- columns below can be added without failing against existing rows; the
-- idempotent seed script (onConflictDoNothing) repopulates them on the
-- next `pnpm db:seed` with the new required fields.
DELETE FROM "listings";--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "employer_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "distribution_radius_km" double precision NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_employer_id_accounts_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;