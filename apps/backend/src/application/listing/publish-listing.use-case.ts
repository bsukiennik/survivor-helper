import { Inject, Injectable } from '@nestjs/common';
import { EmployerNotVerifiedError } from '../../domain/profile/employer-not-verified.error.js';
import type { Listing } from '../../domain/listing/listing.entity.js';
import {
  EMPLOYER_PROFILE_REPOSITORY_PORT,
  type EmployerProfileRepositoryPort,
} from '../ports/employer-profile-repository.port.js';
import { LISTING_REPOSITORY_PORT, type ListingRepositoryPort } from '../ports/listing-repository.port.js';

export interface PublishListingInput {
  employerId: string;
  title: string;
  location: string;
  description: string;
  latitude: number;
  longitude: number;
  distributionRadiusKm: number;
}

/**
 * `POST /me/listings` (Story 3.2). Checks the calling Employer's
 * `employer_profiles.verificationStatus` before creating anything —
 * `'pending'` throws `EmployerNotVerifiedError`, which the controller maps
 * to 403 (Story 3.1's own AC). Every Employer is treated as Standard tier
 * (Boundaries & Constraints, Never) — no Subscription Tier field exists
 * anywhere in this story.
 *
 * `employerName` is snapshotted from `employer_profiles.companyName` at
 * publish time — a deliberate denormalization (Boundaries & Constraints):
 * an Employer renaming their company later does not retroactively update
 * already-published Listings.
 */
@Injectable()
export class PublishListingUseCase {
  constructor(
    @Inject(EMPLOYER_PROFILE_REPOSITORY_PORT)
    private readonly employerProfileRepository: EmployerProfileRepositoryPort,
    @Inject(LISTING_REPOSITORY_PORT)
    private readonly listingRepository: ListingRepositoryPort,
  ) {}

  async execute(input: PublishListingInput): Promise<Listing> {
    const employerProfile = await this.employerProfileRepository.findByAccountId(input.employerId);
    if (!employerProfile || employerProfile.verificationStatus !== 'verified') {
      throw new EmployerNotVerifiedError();
    }

    return this.listingRepository.create({
      employerId: input.employerId,
      title: input.title,
      employerName: employerProfile.companyName,
      location: input.location,
      description: input.description,
      latitude: input.latitude,
      longitude: input.longitude,
      distributionRadiusKm: input.distributionRadiusKm,
    });
  }
}
