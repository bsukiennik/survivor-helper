/**
 * Domain error — zero framework/infrastructure imports (AD-1). Raised by
 * `ApplyToListingUseCase` when `listingId` doesn't reference an existing
 * Listing; `interfaces/application/application.controller.ts` maps this to
 * HTTP 404 — thrown before any transaction/row-lock opens (I/O matrix).
 */
export class ListingNotFoundError extends Error {
  constructor(listingId: string) {
    super(`No Listing found with id "${listingId}".`);
    this.name = 'ListingNotFoundError';
  }
}
