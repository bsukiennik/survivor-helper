import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { PublishListingUseCase } from '../../application/listing/publish-listing.use-case.js';
import { EmployerNotVerifiedError } from '../../domain/profile/employer-not-verified.error.js';
import type { Listing } from '../../domain/listing/listing.entity.js';
import type { AuthenticatedUser } from '../auth/jwt-auth.guard.js';
import { CreateListingDto } from './dto/create-listing.dto.js';
import { MyListingsController } from './my-listings.controller.js';

const USER: AuthenticatedUser = { id: 'account-1', role: 'Employer' };

function makeDto(): CreateListingDto {
  const dto = new CreateListingDto();
  dto.title = 'Boulanger';
  dto.location = 'Paris';
  dto.description = 'Poste à temps plein.';
  dto.latitude = 48.8566;
  dto.longitude = 2.3522;
  dto.distributionRadiusKm = 5;
  return dto;
}

const LISTING: Listing = {
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

function makeUseCaseStub(
  execute: PublishListingUseCase['execute'],
): PublishListingUseCase {
  return { execute } as unknown as PublishListingUseCase;
}

describe('MyListingsController', () => {
  it('maps the created domain Listing to MyListingResponseDto', async () => {
    const controller = new MyListingsController(makeUseCaseStub(async () => LISTING));

    const result = await controller.create(USER, makeDto());

    expect(result).toEqual({
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
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it("passes the authenticated user's id as employerId, not anything from the body", async () => {
    let receivedEmployerId = '';
    const controller = new MyListingsController(
      makeUseCaseStub(async (input) => {
        receivedEmployerId = input.employerId;
        return LISTING;
      }),
    );

    await controller.create(USER, makeDto());

    expect(receivedEmployerId).toBe('account-1');
  });

  it('maps EmployerNotVerifiedError to a 403 ForbiddenException', async () => {
    const controller = new MyListingsController(
      makeUseCaseStub(async () => {
        throw new EmployerNotVerifiedError();
      }),
    );

    await expect(controller.create(USER, makeDto())).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rethrows any other error unmapped', async () => {
    const controller = new MyListingsController(
      makeUseCaseStub(async () => {
        throw new Error('unexpected');
      }),
    );

    await expect(controller.create(USER, makeDto())).rejects.toThrow('unexpected');
  });
});
