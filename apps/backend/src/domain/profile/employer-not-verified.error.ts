/**
 * Domain error — zero framework/infrastructure imports (AD-1). Raised by
 * `PublishListingUseCase` when the calling Employer's
 * `employer_profiles.verificationStatus` is not `'verified'` yet (Story
 * 3.1's own AC: "blocked with a clear status message explaining why").
 * `interfaces/listings/my-listings.controller.ts` maps this to HTTP 403.
 */
export class EmployerNotVerifiedError extends Error {
  constructor() {
    super('Your Employer account is not verified yet — you cannot publish a Listing.');
    this.name = 'EmployerNotVerifiedError';
  }
}
