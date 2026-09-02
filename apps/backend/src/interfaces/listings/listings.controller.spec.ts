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
      employerId: '22222222-2222-4222-8222-222222222222',
      employerName: 'Boulangerie du Marché',
      location: 'Paris',
      description: 'Poste à temps plein.',
      latitude: 48.8566,
      longitude: 2.3522,
      distributionRadiusKm: 10,
      status: 'published',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const controller = new ListingsController(makeUseCaseStub([listing]));

    const result = await controller.list();

    // `ListingDto` (AD-10) never exposes `employerId`/`distributionRadiusKm`/
    // `createdAt` on the public read path — only the pre-Story-3.2 fields.
    expect(result).toEqual([
      {
        id: listing.id,
        title: listing.title,
        employerName: listing.employerName,
        location: listing.location,
        description: listing.description,
        latitude: listing.latitude,
        longitude: listing.longitude,
        status: listing.status,
      },
    ]);
  });

  it('returns an empty array with no error when there are no listings yet', async () => {
    const controller = new ListingsController(makeUseCaseStub([]));

    const result = await controller.list();

    expect(result).toEqual([]);
  });
});
