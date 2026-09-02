import { describe, expect, it } from 'vitest';
import type { Listing } from '../../domain/listing/listing.entity.js';
import type { ListingRepositoryPort } from '../ports/listing-repository.port.js';
import { GetPublishedListingsUseCase } from './get-published-listings.use-case.js';

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Boulanger',
    employerId: '22222222-2222-4222-8222-222222222222',
    employerName: 'Boulangerie du Marché',
    location: 'Paris',
    description: 'Poste à temps plein.',
    latitude: 48.8566,
    longitude: 2.3522,
    distributionRadiusKm: 10,
    status: 'published',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function makeRepository(overrides: Partial<ListingRepositoryPort> = {}): ListingRepositoryPort {
  return {
    findPublished: async () => [],
    findById: async () => null,
    create: async () => makeListing(),
    archiveExpiredListings: async () => 0,
    ...overrides,
  };
}

describe('GetPublishedListingsUseCase', () => {
  it('returns whatever the repository port returns, unfiltered again', async () => {
    const published = [makeListing()];
    const repository = makeRepository({ findPublished: async () => published });

    const useCase = new GetPublishedListingsUseCase(repository);
    const result = await useCase.execute();

    expect(result).toEqual(published);
  });

  it('returns an empty array when there are no published listings', async () => {
    const repository = makeRepository({ findPublished: async () => [] });

    const useCase = new GetPublishedListingsUseCase(repository);
    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
