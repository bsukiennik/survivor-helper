CREATE TYPE "public"."listing_status" AS ENUM('published', 'archived', 'lapsed', 'removed');--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"employer_name" text NOT NULL,
	"description" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"status" "listing_status" DEFAULT 'published' NOT NULL
);
