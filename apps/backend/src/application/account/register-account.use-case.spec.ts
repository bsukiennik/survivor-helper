import { describe, expect, it } from 'vitest';
import type { AccountRepositoryPort } from '../ports/account-repository.port.js';
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

describe('RegisterAccountUseCase', () => {
  it('creates a JobSeeker account and returns an access token on the happy path', async () => {
    const useCase = new RegisterAccountUseCase(
      makeAccountRepository(),
      makePasswordHasher(),
      makeTokenIssuer(),
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
    );

    await expect(
      useCase.execute({ email: 'a@b.com', password: 'correcthorse', role: 'JobSeeker' }),
    ).rejects.toThrow('signing key unavailable');
    expect(deletedId).toBe('11111111-1111-4111-8111-111111111111');
  });
});
