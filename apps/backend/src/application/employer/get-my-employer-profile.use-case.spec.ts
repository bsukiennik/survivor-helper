import { describe, expect, it } from 'vitest';
import type { EmployerProfileRepositoryPort } from '../ports/employer-profile-repository.port.js';
import { GetMyEmployerProfileUseCase } from './get-my-employer-profile.use-case.js';

function makeEmployerProfileRepository(
  overrides: Partial<EmployerProfileRepositoryPort> = {},
): EmployerProfileRepositoryPort {
  return {
    findByAccountId: async () => null,
    create: async (input) => ({
      accountId: input.accountId,
      companyName: input.companyName,
      verificationStatus: 'pending',
    }),
    delete: async () => {},
    ...overrides,
  };
}

describe('GetMyEmployerProfileUseCase', () => {
  it('returns null when no employer profile row exists for the account', async () => {
    const useCase = new GetMyEmployerProfileUseCase(makeEmployerProfileRepository());

    const result = await useCase.execute('account-1');

    expect(result).toBeNull();
  });

  it('returns the pending profile as-is', async () => {
    const useCase = new GetMyEmployerProfileUseCase(
      makeEmployerProfileRepository({
        findByAccountId: async () => ({
          accountId: 'account-1',
          companyName: 'Acme',
          verificationStatus: 'pending',
        }),
      }),
    );

    const result = await useCase.execute('account-1');

    expect(result).toEqual({ accountId: 'account-1', companyName: 'Acme', verificationStatus: 'pending' });
  });

  it('returns the verified profile as-is', async () => {
    const useCase = new GetMyEmployerProfileUseCase(
      makeEmployerProfileRepository({
        findByAccountId: async () => ({
          accountId: 'account-1',
          companyName: 'Acme',
          verificationStatus: 'verified',
        }),
      }),
    );

    const result = await useCase.execute('account-1');

    expect(result?.verificationStatus).toBe('verified');
  });

  it('queries the repository with the given account id', async () => {
    let queriedWith = '';
    const useCase = new GetMyEmployerProfileUseCase(
      makeEmployerProfileRepository({
        findByAccountId: async (accountId) => {
          queriedWith = accountId;
          return null;
        },
      }),
    );

    await useCase.execute('account-42');

    expect(queriedWith).toBe('account-42');
  });
});
