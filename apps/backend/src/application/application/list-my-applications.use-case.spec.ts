import { describe, expect, it } from 'vitest';
import type { ApplicationRepositoryPort, MyApplicationRow } from '../ports/application-repository.port.js';
import { ListMyApplicationsUseCase } from './list-my-applications.use-case.js';

function makeRepository(overrides: Partial<ApplicationRepositoryPort> = {}): ApplicationRepositoryPort {
  return {
    applyToListing: async () => null,
    countByJobSeeker: async () => 0,
    findByJobSeekerWithListing: async () => [],
    ...overrides,
  };
}

const ROW: MyApplicationRow = {
  id: 'application-1',
  listingId: 'listing-1',
  listingTitle: 'Boulanger / Boulangère',
  employerName: 'Boulangerie du Marché',
  status: 'submitted',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('ListMyApplicationsUseCase', () => {
  it('returns [] (not an error) for a fresh account with no Applications', async () => {
    const useCase = new ListMyApplicationsUseCase(makeRepository());

    const result = await useCase.execute('account-1');

    expect(result).toEqual([]);
  });

  it('returns the rows from the repository as-is', async () => {
    const useCase = new ListMyApplicationsUseCase(
      makeRepository({ findByJobSeekerWithListing: async () => [ROW] }),
    );

    const result = await useCase.execute('account-1');

    expect(result).toEqual([ROW]);
  });

  it('queries by the requested job seeker id', async () => {
    let queriedWith = '';
    const useCase = new ListMyApplicationsUseCase(
      makeRepository({
        findByJobSeekerWithListing: async (jobSeekerId) => {
          queriedWith = jobSeekerId;
          return [];
        },
      }),
    );

    await useCase.execute('account-42');

    expect(queriedWith).toBe('account-42');
  });
});
