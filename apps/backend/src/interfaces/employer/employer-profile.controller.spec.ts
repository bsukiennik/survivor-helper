import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { GetMyEmployerProfileUseCase } from '../../application/employer/get-my-employer-profile.use-case.js';
import type { EmployerProfile } from '../../domain/profile/employer-profile.entity.js';
import type { AuthenticatedUser } from '../auth/jwt-auth.guard.js';
import { EmployerProfileController } from './employer-profile.controller.js';

const USER: AuthenticatedUser = { id: 'account-1', role: 'Employer' };

function makeUseCaseStub(
  execute: (accountId: string) => Promise<EmployerProfile | null>,
): GetMyEmployerProfileUseCase {
  return { execute } as unknown as GetMyEmployerProfileUseCase;
}

describe('EmployerProfileController', () => {
  it('returns companyName and verificationStatus verbatim for a pending profile', async () => {
    const controller = new EmployerProfileController(
      makeUseCaseStub(async () => ({
        accountId: 'account-1',
        companyName: 'Acme',
        verificationStatus: 'pending',
      })),
    );

    const result = await controller.get(USER);

    expect(result).toEqual({ companyName: 'Acme', verificationStatus: 'pending' });
  });

  it('returns companyName and verificationStatus verbatim for a verified profile', async () => {
    const controller = new EmployerProfileController(
      makeUseCaseStub(async () => ({
        accountId: 'account-1',
        companyName: 'Acme',
        verificationStatus: 'verified',
      })),
    );

    const result = await controller.get(USER);

    expect(result).toEqual({ companyName: 'Acme', verificationStatus: 'verified' });
  });

  it('queries the use case with the authenticated user id', async () => {
    let queriedWith = '';
    const controller = new EmployerProfileController(
      makeUseCaseStub(async (accountId) => {
        queriedWith = accountId;
        return { accountId, companyName: 'Acme', verificationStatus: 'pending' };
      }),
    );

    await controller.get(USER);

    expect(queriedWith).toBe('account-1');
  });

  it('maps a missing profile row to a 404 NotFoundException', async () => {
    const controller = new EmployerProfileController(makeUseCaseStub(async () => null));

    await expect(controller.get(USER)).rejects.toBeInstanceOf(NotFoundException);
  });
});
