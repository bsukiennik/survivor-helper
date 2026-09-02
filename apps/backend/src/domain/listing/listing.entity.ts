/**
 * Domain entity — zero framework/infrastructure imports (AD-1).
 *
 * `status` is the single shared lifecycle enum for a Listing (AD-12). Only
 * `published` is populated/used in this story; the other values exist so the
 * shape is stable for later stories (moderation, lifecycle jobs) without a
 * migration.
 */
export const LISTING_STATUSES = ['published', 'archived', 'lapsed', 'removed'] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export interface Listing {
  readonly id: string;
  readonly title: string;
  // FK to `accounts.id` (Story 3.2) — resolves the previously-bare
  // `employerName` string into a real owner reference, which is what
  // Story 3.4's triage ownership check will use. `employerName` itself
  // stays a denormalized text snapshot (Boundaries & Constraints) — an
  // Employer renaming their company later does not retroactively update it.
  readonly employerId: string;
  readonly employerName: string;
  readonly location: string;
  readonly description: string;
  readonly latitude: number;
  readonly longitude: number;
  // Standard tier's publish radius, capped at 10km (Story 3.2) — Premium
  // has no defined parameters yet, so every Employer is treated as
  // Standard (Boundaries & Constraints, Never).
  readonly distributionRadiusKm: number;
  readonly status: ListingStatus;
  readonly createdAt: Date;
}
