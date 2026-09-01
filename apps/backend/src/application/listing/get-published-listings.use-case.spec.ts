import { describe, expect, it } from 'vitest';
import type { Listing } from '../../domain/listing/listing.entity.js';
import type { ListingRepositoryPort } from '../ports/listing-repository.port.js';
import { GetPublishedListingsUseCase } from './get-published-listings.use-case.js';

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Boulanger',
    employerName: 'Boulangerie du Marché',
    location: 'Paris',
    description: 'Poste à temps plein.',
    latitude: 48.8566,
    longitude: 2.3522,
    status: 'published',
    ...overrides,
  };
}

describe('GetPublishedListingsUseCase', () => {
  it('returns whatever the repository port returns, unfiltered again', async () => {
    const published = [makeListing()];
    const repository: ListingRepositoryPort = {
      findPublished: async () => published,
    };

    const useCase = new GetPublishedListingsUseCase(repository);
    const result = await useCase.execute();

    expect(result).toEqual(published);
  });

  it('returns an empty array when there are no published listings', async () => {
    const repository: ListingRepositoryPort = {
      findPublished: async () => [],
    };

    const useCase = new GetPublishedListingsUseCase(repository);
    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
