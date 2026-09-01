import { describe, expect, it } from 'vitest';
import type { JobSeekerProfileRepositoryPort } from '../ports/job-seeker-profile-repository.port.js';
import { SaveMyProfileUseCase } from './save-my-profile.use-case.js';

function makeRepository(overrides: Partial<JobSeekerProfileRepositoryPort> = {}): JobSeekerProfileRepositoryPort {
  return {
    findByAccountId: async () => null,
    upsert: async (input) => ({ ...input, updatedAt: new Date('2026-01-01T00:00:00.000Z') }),
    ...overrides,
  };
}

describe('SaveMyProfileUseCase', () => {
  it('upserts the profile with the given fields and returns the saved row', async () => {
    const useCase = new SaveMyProfileUseCase(makeRepository());

    const result = await useCase.execute({
      accountId: 'account-1',
      skills: 'Boulangerie',
      experience: '3 ans',
      availability: 'Immédiate',
    });

    expect(result).toEqual({
      accountId: 'account-1',
      skills: 'Boulangerie',
      experience: '3 ans',
      availability: 'Immédiate',
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
  });

  it('delegates straight to the repository upsert (no extra mutation of the input)', async () => {
    let upsertedWith: unknown;
    const useCase = new SaveMyProfileUseCase(
      makeRepository({
        upsert: async (input) => {
          upsertedWith = input;
          return { ...input, updatedAt: new Date('2026-01-01T00:00:00.000Z') };
        },
      }),
    );

    await useCase.execute({
      accountId: 'account-1',
      skills: 'Boulangerie',
      experience: '3 ans',
      availability: 'Immédiate',
    });

    expect(upsertedWith).toEqual({
      accountId: 'account-1',
      skills: 'Boulangerie',
      experience: '3 ans',
      availability: 'Immédiate',
    });
  });
});
