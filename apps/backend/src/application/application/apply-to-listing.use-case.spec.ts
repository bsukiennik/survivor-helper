import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Application } from '../../domain/application/application.entity.js';
import { ListingNotFoundError } from '../../domain/listing/listing-not-found.error.js';
import type { Listing } from '../../domain/listing/listing.entity.js';
import type { ApplicationRepositoryPort } from '../ports/application-repository.port.js';
import type { ListingRepositoryPort } from '../ports/listing-repository.port.js';
import { ApplyToListingUseCase } from './apply-to-listing.use-case.js';

const LISTING: Listing = {
  id: 'listing-1',
  title: 'Boulanger',
  employerName: 'Boulangerie du Marché',
  location: 'Paris',
  description: 'Poste à temps plein.',
  latitude: 48.8566,
  longitude: 2.3522,
  status: 'published',
};

const APPLICATION: Application = {
  id: 'application-1',
  jobSeekerId: 'account-1',
  listingId: 'listing-1',
  status: 'submitted',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

function makeListingRepository(overrides: Partial<ListingRepositoryPort> = {}): ListingRepositoryPort {
  return {
    findPublished: async () => [LISTING],
    findById: async () => LISTING,
    ...overrides,
  };
}

function makeApplicationRepository(
  overrides: Partial<ApplicationRepositoryPort> = {},
): ApplicationRepositoryPort {
  return {
    applyToListing: async () => APPLICATION,
    ...overrides,
  };
}

describe('ApplyToListingUseCase', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates the Application, returns it, and logs exactly once on first catch', async () => {
    const logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const applyToListing = vi.fn(async () => APPLICATION);
    const useCase = new ApplyToListingUseCase(
      makeListingRepository(),
      makeApplicationRepository({ applyToListing }),
    );

    const result = await useCase.execute({ jobSeekerId: 'account-1', listingId: 'listing-1' });

    expect(result).toEqual(APPLICATION);
    expect(applyToListing).toHaveBeenCalledWith({ jobSeekerId: 'account-1', listingId: 'listing-1' });
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][0]).toContain('account-1');
    expect(logSpy.mock.calls[0][0]).toContain('listing-1');
  });

  it('returns null and never logs on a repeat catch (already existed) — silent no-op, not an error', async () => {
    const logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const applyToListing = vi.fn(async () => null);
    const useCase = new ApplyToListingUseCase(
      makeListingRepository(),
      makeApplicationRepository({ applyToListing }),
    );

    const result = await useCase.execute({ jobSeekerId: 'account-1', listingId: 'listing-1' });

    expect(result).toBeNull();
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('throws ListingNotFoundError and never opens the transaction when the listing does not exist', async () => {
    const applyToListing = vi.fn(async () => APPLICATION);
    const useCase = new ApplyToListingUseCase(
      makeListingRepository({ findById: async () => null }),
      makeApplicationRepository({ applyToListing }),
    );

    await expect(
      useCase.execute({ jobSeekerId: 'account-1', listingId: 'missing-listing' }),
    ).rejects.toThrow(ListingNotFoundError);
    expect(applyToListing).not.toHaveBeenCalled();
  });

  it('throws ListingNotFoundError and never opens the transaction when the listing exists but is not published', async () => {
    const applyToListing = vi.fn(async () => APPLICATION);
    const archivedListing: Listing = { ...LISTING, status: 'archived' };
    const useCase = new ApplyToListingUseCase(
      makeListingRepository({ findById: async () => archivedListing }),
      makeApplicationRepository({ applyToListing }),
    );

    await expect(
      useCase.execute({ jobSeekerId: 'account-1', listingId: 'listing-1' }),
    ).rejects.toThrow(ListingNotFoundError);
    expect(applyToListing).not.toHaveBeenCalled();
  });
});
