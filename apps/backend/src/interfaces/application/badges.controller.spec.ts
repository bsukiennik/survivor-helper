import { describe, expect, it } from 'vitest';
import { GetMyBadgesUseCase } from '../../application/application/get-my-badges.use-case.js';
import type { MyBadges } from '../../application/application/get-my-badges.use-case.js';
import type { AuthenticatedUser } from '../auth/jwt-auth.guard.js';
import { BadgesController } from './badges.controller.js';

const USER: AuthenticatedUser = { id: 'account-1', role: 'JobSeeker' };

function makeUseCaseStub(execute: (accountId: string) => Promise<MyBadges>): GetMyBadgesUseCase {
  return { execute } as unknown as GetMyBadgesUseCase;
}

describe('BadgesController', () => {
  it('returns catchCount 0 and permisDeTravailUnlocked false for a fresh account', async () => {
    const controller = new BadgesController(
      makeUseCaseStub(async () => ({ catchCount: 0, permisDeTravailUnlocked: false })),
    );

    const result = await controller.get(USER);

    expect(result).toEqual({ catchCount: 0, permisDeTravailUnlocked: false });
  });

  it('returns permisDeTravailUnlocked: true once the threshold is reached', async () => {
    const controller = new BadgesController(
      makeUseCaseStub(async () => ({ catchCount: 10, permisDeTravailUnlocked: true })),
    );

    const result = await controller.get(USER);

    expect(result).toEqual({ catchCount: 10, permisDeTravailUnlocked: true });
  });

  it('queries the use case with the authenticated user id', async () => {
    let queriedWith = '';
    const controller = new BadgesController(
      makeUseCaseStub(async (accountId) => {
        queriedWith = accountId;
        return { catchCount: 3, permisDeTravailUnlocked: false };
      }),
    );

    await controller.get(USER);

    expect(queriedWith).toBe('account-1');
  });
});
