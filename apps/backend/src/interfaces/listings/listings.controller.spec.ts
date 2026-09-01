import { describe, expect, it } from 'vitest';
import type { Listing } from '../../domain/listing/listing.entity.js';
import { GetPublishedListingsUseCase } from '../../application/listing/get-published-listings.use-case.js';
import { ListingsController } from './listings.controller.js';

function makeUseCaseStub(listings: Listing[]): GetPublishedListingsUseCase {
  return { execute: async () => listings } as unknown as GetPublishedListingsUseCase;
}

describe('ListingsController', () => {
  it('maps domain Listings to DTOs', async () => {
    const listing: Listing = {
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Boulanger',
      employerName: 'Boulangerie du Marché',
      location: 'Paris',
      description: 'Poste à temps plein.',
      latitude: 48.8566,
      longitude: 2.3522,
      status: 'published',
    };
    const controller = new ListingsController(makeUseCaseStub([listing]));

    const result = await controller.list();

    expect(result).toEqual([listing]);
  });

  it('returns an empty array with no error when there are no listings yet', async () => {
    const controller = new ListingsController(makeUseCaseStub([]));

    const result = await controller.list();

    expect(result).toEqual([]);
  });
});
