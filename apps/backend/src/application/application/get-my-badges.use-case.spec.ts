import { describe, expect, it } from 'vitest';
import type { ApplicationRepositoryPort } from '../ports/application-repository.port.js';
import { GetMyBadgesUseCase } from './get-my-badges.use-case.js';

function makeRepository(overrides: Partial<ApplicationRepositoryPort> = {}): ApplicationRepositoryPort {
  return {
    applyToListing: async () => null,
    countByJobSeeker: async () => 0,
    ...overrides,
  };
}

describe('GetMyBadgesUseCase', () => {
  it('returns catchCount 0 and permisDeTravailUnlocked false (not an error) for a fresh account', async () => {
    const useCase = new GetMyBadgesUseCase(makeRepository());

    const result = await useCase.execute('account-1');

    expect(result).toEqual({ catchCount: 0, permisDeTravailUnlocked: false });
  });

  it('reports permisDeTravailUnlocked: false below the threshold', async () => {
    const useCase = new GetMyBadgesUseCase(makeRepository({ countByJobSeeker: async () => 9 }));

    const result = await useCase.execute('account-1');

    expect(result).toEqual({ catchCount: 9, permisDeTravailUnlocked: false });
  });

  it('reports permisDeTravailUnlocked: true at exactly the threshold', async () => {
    const useCase = new GetMyBadgesUseCase(makeRepository({ countByJobSeeker: async () => 10 }));

    const result = await useCase.execute('account-1');

    expect(result).toEqual({ catchCount: 10, permisDeTravailUnlocked: true });
  });

  it('keeps permisDeTravailUnlocked: true past the threshold', async () => {
    const useCase = new GetMyBadgesUseCase(makeRepository({ countByJobSeeker: async () => 15 }));

    const result = await useCase.execute('account-1');

    expect(result).toEqual({ catchCount: 15, permisDeTravailUnlocked: true });
  });

  it('queries by the requested account id', async () => {
    let queriedWith = '';
    const useCase = new GetMyBadgesUseCase(
      makeRepository({
        countByJobSeeker: async (accountId) => {
          queriedWith = accountId;
          return 3;
        },
      }),
    );

    await useCase.execute('account-42');

    expect(queriedWith).toBe('account-42');
  });
});
