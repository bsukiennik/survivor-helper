import { NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { ApplyToListingUseCase } from '../../application/application/apply-to-listing.use-case.js';
import type { Application } from '../../domain/application/application.entity.js';
import { ListingNotFoundError } from '../../domain/listing/listing-not-found.error.js';
import type { AuthenticatedUser } from '../auth/jwt-auth.guard.js';
import { ApplicationController } from './application.controller.js';
import { CatchDto } from './dto/catch.dto.js';

const USER: AuthenticatedUser = { id: 'account-1', role: 'JobSeeker' };

const APPLICATION: Application = {
  id: 'application-1',
  jobSeekerId: 'account-1',
  listingId: 'listing-1',
  status: 'submitted',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

function makeUseCaseStub(execute: () => Promise<Application | null>): ApplyToListingUseCase {
  return { execute } as unknown as ApplyToListingUseCase;
}

function makeResStub() {
  const res = { status: vi.fn() };
  res.status.mockReturnValue(res);
  return res as unknown as Response & { status: ReturnType<typeof vi.fn> };
}

function makeDto(listingId: string): CatchDto {
  const dto = new CatchDto();
  dto.listingId = listingId;
  return dto;
}

describe('ApplicationController', () => {
  it('responds 201 with the created Application on first catch', async () => {
    const controller = new ApplicationController(makeUseCaseStub(async () => APPLICATION));
    const res = makeResStub();

    const result = await controller.apply(USER, makeDto('listing-1'), res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(result).toEqual({ id: 'application-1', listingId: 'listing-1', alreadyApplied: false });
  });

  it('responds 200 with alreadyApplied: true on a repeat catch, no error', async () => {
    const controller = new ApplicationController(makeUseCaseStub(async () => null));
    const res = makeResStub();

    const result = await controller.apply(USER, makeDto('listing-1'), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(result).toEqual({ id: null, listingId: 'listing-1', alreadyApplied: true });
  });

  it('maps ListingNotFoundError to a 404 NotFoundException', async () => {
    const controller = new ApplicationController(
      makeUseCaseStub(async () => {
        throw new ListingNotFoundError('missing-listing');
      }),
    );
    const res = makeResStub();

    await expect(controller.apply(USER, makeDto('missing-listing'), res)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('passes the authenticated user id (not anything from the body) as jobSeekerId', async () => {
    let executedWith: unknown;
    const useCase = {
      execute: async (input: unknown) => {
        executedWith = input;
        return APPLICATION;
      },
    } as unknown as ApplyToListingUseCase;
    const controller = new ApplicationController(useCase);
    const res = makeResStub();

    await controller.apply(USER, makeDto('listing-1'), res);

    expect(executedWith).toEqual({ jobSeekerId: 'account-1', listingId: 'listing-1' });
  });
});
