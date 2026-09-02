import { describe, expect, it, vi } from 'vitest';
import { EmployerNotVerifiedError } from '../../domain/profile/employer-not-verified.error.js';
import type { EmployerProfile } from '../../domain/profile/employer-profile.entity.js';
import type { Listing } from '../../domain/listing/listing.entity.js';
import type { EmployerProfileRepositoryPort } from '../ports/employer-profile-repository.port.js';
import type { ListingRepositoryPort } from '../ports/listing-repository.port.js';
import { PublishListingUseCase } from './publish-listing.use-case.js';

const VERIFIED_PROFILE: EmployerProfile = {
  accountId: 'account-1',
  companyName: 'Acme',
  verificationStatus: 'verified',
};

const PENDING_PROFILE: EmployerProfile = {
  accountId: 'account-1',
  companyName: 'Acme',
  verificationStatus: 'pending',
};

const CREATED_LISTING: Listing = {
  id: 'listing-1',
  title: 'Boulanger',
  employerId: 'account-1',
  employerName: 'Acme',
  location: 'Paris',
  description: 'Poste à temps plein.',
  latitude: 48.8566,
  longitude: 2.3522,
  distributionRadiusKm: 5,
  status: 'published',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const INPUT = {
  employerId: 'account-1',
  title: 'Boulanger',
  location: 'Paris',
  description: 'Poste à temps plein.',
  latitude: 48.8566,
  longitude: 2.3522,
  distributionRadiusKm: 5,
};

function makeEmployerProfileRepository(
  overrides: Partial<EmployerProfileRepositoryPort> = {},
): EmployerProfileRepositoryPort {
  return {
    findByAccountId: async () => VERIFIED_PROFILE,
    create: async (input) => ({
      accountId: input.accountId,
      companyName: input.companyName,
      verificationStatus: 'pending',
    }),
    delete: async () => {},
    ...overrides,
  };
}

function makeListingRepository(overrides: Partial<ListingRepositoryPort> = {}): ListingRepositoryPort {
  return {
    findPublished: async () => [],
    findById: async () => null,
    create: async () => CREATED_LISTING,
    archiveExpiredListings: async () => 0,
    ...overrides,
  };
}

describe('PublishListingUseCase', () => {
  it('creates and returns the Listing when the Employer is verified', async () => {
    const create = vi.fn(async () => CREATED_LISTING);
    const useCase = new PublishListingUseCase(
      makeEmployerProfileRepository(),
      makeListingRepository({ create }),
    );

    const result = await useCase.execute(INPUT);

    expect(result).toEqual(CREATED_LISTING);
    expect(create).toHaveBeenCalledWith({
      employerId: 'account-1',
      title: 'Boulanger',
      employerName: 'Acme',
      location: 'Paris',
      description: 'Poste à temps plein.',
      latitude: 48.8566,
      longitude: 2.3522,
      distributionRadiusKm: 5,
    });
  });

  it('snapshots employerName from the profile companyName, not any caller-supplied value', async () => {
    const create = vi.fn(async () => CREATED_LISTING);
    const useCase = new PublishListingUseCase(
      makeEmployerProfileRepository({
        findByAccountId: async () => ({ ...VERIFIED_PROFILE, companyName: 'Renamed Co' }),
      }),
      makeListingRepository({ create }),
    );

    await useCase.execute(INPUT);

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ employerName: 'Renamed Co' }));
  });

  it('throws EmployerNotVerifiedError and never creates a Listing when verificationStatus is pending', async () => {
    const create = vi.fn(async () => CREATED_LISTING);
    const useCase = new PublishListingUseCase(
      makeEmployerProfileRepository({ findByAccountId: async () => PENDING_PROFILE }),
      makeListingRepository({ create }),
    );

    await expect(useCase.execute(INPUT)).rejects.toThrow(EmployerNotVerifiedError);
    expect(create).not.toHaveBeenCalled();
  });

  it('throws EmployerNotVerifiedError and never creates a Listing when no employer profile exists', async () => {
    const create = vi.fn(async () => CREATED_LISTING);
    const useCase = new PublishListingUseCase(
      makeEmployerProfileRepository({ findByAccountId: async () => null }),
      makeListingRepository({ create }),
    );

    await expect(useCase.execute(INPUT)).rejects.toThrow(EmployerNotVerifiedError);
    expect(create).not.toHaveBeenCalled();
  });
});
