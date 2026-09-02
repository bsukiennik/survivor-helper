import { NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { ApplyToListingResult } from '../../application/application/apply-to-listing.use-case.js';
import { ApplyToListingUseCase } from '../../application/application/apply-to-listing.use-case.js';
import type { ListMyApplicationsUseCase } from '../../application/application/list-my-applications.use-case.js';
import type { MyApplicationRow } from '../../application/ports/application-repository.port.js';
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

const RESULT: ApplyToListingResult = {
  application: APPLICATION,
  catchCount: 1,
  permisDeTravailUnlocked: false,
};

function makeUseCaseStub(
  execute: () => Promise<ApplyToListingResult | null>,
): ApplyToListingUseCase {
  return { execute } as unknown as ApplyToListingUseCase;
}

function makeListUseCaseStub(
  execute: (jobSeekerId: string) => Promise<MyApplicationRow[]> = async () => [],
): ListMyApplicationsUseCase {
  return { execute } as unknown as ListMyApplicationsUseCase;
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
  it('responds 201 with the created Application and catchCount on first catch', async () => {
    const controller = new ApplicationController(
      makeUseCaseStub(async () => RESULT),
      makeListUseCaseStub(),
    );
    const res = makeResStub();

    const result = await controller.apply(USER, makeDto('listing-1'), res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(result).toEqual({
      id: 'application-1',
      listingId: 'listing-1',
      alreadyApplied: false,
      catchCount: 1,
      permisDeTravailUnlocked: false,
    });
  });

  it('responds 201 with permisDeTravailUnlocked: true on the 10th catch', async () => {
    const controller = new ApplicationController(
      makeUseCaseStub(async () => ({ ...RESULT, catchCount: 10, permisDeTravailUnlocked: true })),
      makeListUseCaseStub(),
    );
    const res = makeResStub();

    const result = await controller.apply(USER, makeDto('listing-1'), res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(result).toEqual({
      id: 'application-1',
      listingId: 'listing-1',
      alreadyApplied: false,
      catchCount: 10,
      permisDeTravailUnlocked: true,
    });
  });

  it('responds 200 with alreadyApplied: true, catchCount: null, permisDeTravailUnlocked: false on a repeat catch, no error', async () => {
    const controller = new ApplicationController(
      makeUseCaseStub(async () => null),
      makeListUseCaseStub(),
    );
    const res = makeResStub();

    const result = await controller.apply(USER, makeDto('listing-1'), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(result).toEqual({
      id: null,
      listingId: 'listing-1',
      alreadyApplied: true,
      catchCount: null,
      permisDeTravailUnlocked: false,
    });
  });

  it('maps ListingNotFoundError to a 404 NotFoundException', async () => {
    const controller = new ApplicationController(
      makeUseCaseStub(async () => {
        throw new ListingNotFoundError('missing-listing');
      }),
      makeListUseCaseStub(),
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
        return RESULT;
      },
    } as unknown as ApplyToListingUseCase;
    const controller = new ApplicationController(useCase, makeListUseCaseStub());
    const res = makeResStub();

    await controller.apply(USER, makeDto('listing-1'), res);

    expect(executedWith).toEqual({ jobSeekerId: 'account-1', listingId: 'listing-1' });
  });
});

describe('ApplicationController.list (GET /me/applications)', () => {
  const ROW: MyApplicationRow = {
    id: 'application-1',
    listingId: 'listing-1',
    listingTitle: 'Boulanger / Boulangère',
    employerName: 'Boulangerie du Marché',
    status: 'submitted',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  it('returns [] (not an error) for a fresh account with no Applications', async () => {
    const controller = new ApplicationController(
      makeUseCaseStub(async () => RESULT),
      makeListUseCaseStub(async () => []),
    );

    const result = await controller.list(USER);

    expect(result).toEqual([]);
  });

  it('maps each row to a DTO with listing title/employer/status', async () => {
    const controller = new ApplicationController(
      makeUseCaseStub(async () => RESULT),
      makeListUseCaseStub(async () => [ROW]),
    );

    const result = await controller.list(USER);

    expect(result).toEqual([
      {
        id: 'application-1',
        listingId: 'listing-1',
        listingTitle: 'Boulanger / Boulangère',
        employerName: 'Boulangerie du Marché',
        status: 'submitted',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
  });

  it('reflects a seeded non-default status verbatim', async () => {
    const controller = new ApplicationController(
      makeUseCaseStub(async () => RESULT),
      makeListUseCaseStub(async () => [{ ...ROW, status: 'shortlisted' }]),
    );

    const result = await controller.list(USER);

    expect(result[0]?.status).toBe('shortlisted');
  });

  it('queries the use case with the authenticated user id, not anything from the request', async () => {
    let queriedWith = '';
    const controller = new ApplicationController(
      makeUseCaseStub(async () => RESULT),
      makeListUseCaseStub(async (jobSeekerId) => {
        queriedWith = jobSeekerId;
        return [];
      }),
    );

    await controller.list(USER);

    expect(queriedWith).toBe('account-1');
  });
});
