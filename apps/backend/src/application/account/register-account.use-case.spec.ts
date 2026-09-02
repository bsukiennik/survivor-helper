import { describe, expect, it } from 'vitest';
import type { AccountRepositoryPort } from '../ports/account-repository.port.js';
import type { EmployerProfileRepositoryPort } from '../ports/employer-profile-repository.port.js';
import type { PasswordHasherPort } from '../ports/password-hasher.port.js';
import type { TokenIssuerPort } from '../ports/token-issuer.port.js';
import { RegisterAccountUseCase } from './register-account.use-case.js';

function makeAccountRepository(overrides: Partial<AccountRepositoryPort> = {}): AccountRepositoryPort {
  return {
    findByEmail: async () => null,
    create: async (input) => ({
      id: '11111111-1111-4111-8111-111111111111',
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }),
    delete: async () => {},
    ...overrides,
  };
}

function makePasswordHasher(): PasswordHasherPort {
  return {
    hash: async (plainTextPassword) => `hashed:${plainTextPassword}`,
    compare: async () => true,
  };
}

function makeTokenIssuer(): TokenIssuerPort {
  return { issue: async () => 'signed-token' };
}

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

describe('RegisterAccountUseCase', () => {
  it('creates a JobSeeker account and returns an access token on the happy path', async () => {
    const useCase = new RegisterAccountUseCase(
      makeAccountRepository(),
      makePasswordHasher(),
      makeTokenIssuer(),
      makeEmployerProfileRepository(),
    );

    const result = await useCase.execute({
      email: 'a@b.com',
      password: 'correcthorse',
      role: 'JobSeeker',
    });

    expect(result).toEqual({ accessToken: 'signed-token' });
  });

  it('hashes the password before persisting — never stores the plaintext password', async () => {
    let persistedPasswordHash = '';
    const useCase = new RegisterAccountUseCase(
      makeAccountRepository({
        create: async (input) => {
          persistedPasswordHash = input.passwordHash;
          return {
            id: '11111111-1111-4111-8111-111111111111',
            email: input.email,
            passwordHash: input.passwordHash,
            role: input.role,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
          };
        },
      }),
      makePasswordHasher(),
      makeTokenIssuer(),
      makeEmployerProfileRepository(),
    );

    await useCase.execute({ email: 'a@b.com', password: 'correcthorse', role: 'JobSeeker' });

    expect(persistedPasswordHash).toBe('hashed:correcthorse');
  });

  it('rejects an already-registered email without creating a duplicate account', async () => {
    let createCalled = false;
    const useCase = new RegisterAccountUseCase(
      makeAccountRepository({
        findByEmail: async () => ({
          id: '11111111-1111-4111-8111-111111111111',
          email: 'a@b.com',
          passwordHash: 'existing-hash',
          role: 'JobSeeker',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
        create: async (input) => {
          createCalled = true;
          return {
            id: 'should-not-happen',
            email: input.email,
            passwordHash: input.passwordHash,
            role: input.role,
            createdAt: new Date(),
          };
        },
      }),
      makePasswordHasher(),
      makeTokenIssuer(),
      makeEmployerProfileRepository(),
    );

    await expect(
      useCase.execute({ email: 'a@b.com', password: 'correcthorse', role: 'JobSeeker' }),
    ).rejects.toThrow(/already exists/i);
    expect(createCalled).toBe(false);
  });

  it('normalizes email (trim + lowercase) before checking and persisting it', async () => {
    let lookedUpWith = '';
    let persistedWith = '';
    const useCase = new RegisterAccountUseCase(
      makeAccountRepository({
        findByEmail: async (email) => {
          lookedUpWith = email;
          return null;
        },
        create: async (input) => {
          persistedWith = input.email;
          return {
            id: '11111111-1111-4111-8111-111111111111',
            email: input.email,
            passwordHash: input.passwordHash,
            role: input.role,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
          };
        },
      }),
      makePasswordHasher(),
      makeTokenIssuer(),
      makeEmployerProfileRepository(),
    );

    await useCase.execute({
      email: '  User@Example.com  ',
      password: 'correcthorse',
      role: 'JobSeeker',
    });

    expect(lookedUpWith).toBe('user@example.com');
    expect(persistedWith).toBe('user@example.com');
  });

  it('rolls back (deletes) the just-created account if token issuance fails', async () => {
    let deletedId = '';
    const useCase = new RegisterAccountUseCase(
      makeAccountRepository({ delete: async (id) => { deletedId = id; } }),
      makePasswordHasher(),
      { issue: async () => { throw new Error('signing key unavailable'); } },
      makeEmployerProfileRepository(),
    );

    await expect(
      useCase.execute({ email: 'a@b.com', password: 'correcthorse', role: 'JobSeeker' }),
    ).rejects.toThrow('signing key unavailable');
    expect(deletedId).toBe('11111111-1111-4111-8111-111111111111');
  });

  it('does not create an employer_profiles row for a JobSeeker registration', async () => {
    let employerCreateCalled = false;
    const useCase = new RegisterAccountUseCase(
      makeAccountRepository(),
      makePasswordHasher(),
      makeTokenIssuer(),
      makeEmployerProfileRepository({
        create: async (input) => {
          employerCreateCalled = true;
          return { accountId: input.accountId, companyName: input.companyName, verificationStatus: 'pending' };
        },
      }),
    );

    await useCase.execute({ email: 'a@b.com', password: 'correcthorse', role: 'JobSeeker' });

    expect(employerCreateCalled).toBe(false);
  });

  it('creates an Employer account plus a pending employer_profiles row on the happy path', async () => {
    let receivedProfileInput: { accountId: string; companyName: string } | undefined;
    const useCase = new RegisterAccountUseCase(
      makeAccountRepository({
        create: async (input) => ({
          id: '22222222-2222-4222-8222-222222222222',
          email: input.email,
          passwordHash: input.passwordHash,
          role: input.role,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
      }),
      makePasswordHasher(),
      makeTokenIssuer(),
      makeEmployerProfileRepository({
        create: async (input) => {
          receivedProfileInput = input;
          return { accountId: input.accountId, companyName: input.companyName, verificationStatus: 'pending' };
        },
      }),
    );

    const result = await useCase.execute({
      email: 'employer@x.com',
      password: 'correcthorse',
      role: 'Employer',
      employerProfile: { companyName: 'Acme' },
    });

    expect(result).toEqual({ accessToken: 'signed-token' });
    expect(receivedProfileInput).toEqual({
      accountId: '22222222-2222-4222-8222-222222222222',
      companyName: 'Acme',
    });
  });

  it('rolls back both the employer_profiles row and the account, in FK-safe order, if token issuance fails for an Employer registration', async () => {
    const calls: string[] = [];
    const useCase = new RegisterAccountUseCase(
      makeAccountRepository({
        delete: async (id) => {
          calls.push(`account:${id}`);
        },
      }),
      makePasswordHasher(),
      { issue: async () => { throw new Error('signing key unavailable'); } },
      makeEmployerProfileRepository({
        delete: async (accountId) => {
          calls.push(`employerProfile:${accountId}`);
        },
      }),
    );

    await expect(
      useCase.execute({
        email: 'employer@x.com',
        password: 'correcthorse',
        role: 'Employer',
        employerProfile: { companyName: 'Acme' },
      }),
    ).rejects.toThrow('signing key unavailable');

    expect(calls).toEqual([
      'employerProfile:11111111-1111-4111-8111-111111111111',
      'account:11111111-1111-4111-8111-111111111111',
    ]);
  });

  it('rolls back the account (with no employer_profiles delete attempt) if creating the employer_profiles row itself fails', async () => {
    const calls: string[] = [];
    const employerProfileDelete = async (accountId: string): Promise<void> => {
      calls.push(`employerProfile:${accountId}`);
    };
    const useCase = new RegisterAccountUseCase(
      makeAccountRepository({
        delete: async (id) => {
          calls.push(`account:${id}`);
        },
      }),
      makePasswordHasher(),
      makeTokenIssuer(),
      makeEmployerProfileRepository({
        create: async () => {
          throw new Error('unique_violation');
        },
        delete: employerProfileDelete,
      }),
    );

    await expect(
      useCase.execute({
        email: 'employer@x.com',
        password: 'correcthorse',
        role: 'Employer',
        employerProfile: { companyName: 'Acme' },
      }),
    ).rejects.toThrow('unique_violation');

    // The profile row was never created, so there is nothing to delete —
    // only the account rollback should run. If this ever calls
    // `employerProfile:...`, that itself is harmless (a delete on a
    // nonexistent row) but would prove the guard flag isn't doing its job.
    expect(calls).toEqual(['account:11111111-1111-4111-8111-111111111111']);
  });
});
