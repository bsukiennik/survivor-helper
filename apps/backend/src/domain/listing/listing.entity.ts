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
  readonly employerName: string;
  readonly description: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly status: ListingStatus;
}
