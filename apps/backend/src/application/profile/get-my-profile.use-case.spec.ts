import { describe, expect, it } from 'vitest';
import type { JobSeekerProfileRepositoryPort } from '../ports/job-seeker-profile-repository.port.js';
import { GetMyProfileUseCase } from './get-my-profile.use-case.js';

function makeRepository(overrides: Partial<JobSeekerProfileRepositoryPort> = {}): JobSeekerProfileRepositoryPort {
  return {
    findByAccountId: async () => null,
    upsert: async (input) => ({ ...input, updatedAt: new Date('2026-01-01T00:00:00.000Z') }),
    ...overrides,
  };
}

describe('GetMyProfileUseCase', () => {
  it('returns null (not an error) when no profile row exists yet', async () => {
    const useCase = new GetMyProfileUseCase(makeRepository());

    const result = await useCase.execute('account-1');

    expect(result).toBeNull();
  });

  it('returns the profile keyed by the requested account id', async () => {
    const profile = {
      accountId: 'account-1',
      skills: 'Boulangerie',
      experience: '3 ans',
      availability: 'Immédiate',
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    let queriedWith = '';
    const useCase = new GetMyProfileUseCase(
      makeRepository({
        findByAccountId: async (accountId) => {
          queriedWith = accountId;
          return profile;
        },
      }),
    );

    const result = await useCase.execute('account-1');

    expect(result).toEqual(profile);
    expect(queriedWith).toBe('account-1');
  });
});
