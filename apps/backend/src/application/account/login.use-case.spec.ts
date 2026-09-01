import { describe, expect, it } from 'vitest';
import type { Account } from '../../domain/account/account.entity.js';
import type { AccountRepositoryPort } from '../ports/account-repository.port.js';
import type { PasswordHasherPort } from '../ports/password-hasher.port.js';
import type { TokenIssuerPort } from '../ports/token-issuer.port.js';
import { LoginUseCase } from './login.use-case.js';

const EXISTING_ACCOUNT: Account = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'a@b.com',
  passwordHash: 'stored-hash',
  role: 'JobSeeker',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

function makeAccountRepository(overrides: Partial<AccountRepositoryPort> = {}): AccountRepositoryPort {
  return {
    findByEmail: async () => EXISTING_ACCOUNT,
    create: async () => EXISTING_ACCOUNT,
    delete: async () => {},
    ...overrides,
  };
}

function makeTokenIssuer(): TokenIssuerPort {
  return { issue: async () => 'signed-token' };
}

describe('LoginUseCase', () => {
  it('returns an access token when the credentials are correct', async () => {
    const passwordHasher: PasswordHasherPort = { hash: async () => '', compare: async () => true };
    const useCase = new LoginUseCase(makeAccountRepository(), passwordHasher, makeTokenIssuer());

    const result = await useCase.execute({ email: 'a@b.com', password: 'correcthorse' });

    expect(result).toEqual({ accessToken: 'signed-token' });
  });

  it('rejects with a generic error and issues no token when the password is wrong', async () => {
    const passwordHasher: PasswordHasherPort = { hash: async () => '', compare: async () => false };
    let issueCalled = false;
    const tokenIssuer: TokenIssuerPort = {
      issue: async () => {
        issueCalled = true;
        return 'should-not-happen';
      },
    };
    const useCase = new LoginUseCase(makeAccountRepository(), passwordHasher, tokenIssuer);

    await expect(
      useCase.execute({ email: 'a@b.com', password: 'wrong-password' }),
    ).rejects.toThrow(/invalid credentials/i);
    expect(issueCalled).toBe(false);
  });

  it('rejects with the same generic error when the email is not registered (never reveals which field was wrong)', async () => {
    const passwordHasher: PasswordHasherPort = { hash: async () => '', compare: async () => true };
    const useCase = new LoginUseCase(
      makeAccountRepository({ findByEmail: async () => null }),
      passwordHasher,
      makeTokenIssuer(),
    );

    await expect(
      useCase.execute({ email: 'nobody@b.com', password: 'correcthorse' }),
    ).rejects.toThrow(/invalid credentials/i);
  });

  it('normalizes email (trim + lowercase) before looking it up', async () => {
    let lookedUpWith = '';
    const passwordHasher: PasswordHasherPort = { hash: async () => '', compare: async () => true };
    const useCase = new LoginUseCase(
      makeAccountRepository({
        findByEmail: async (email) => {
          lookedUpWith = email;
          return EXISTING_ACCOUNT;
        },
      }),
      passwordHasher,
      makeTokenIssuer(),
    );

    await useCase.execute({ email: '  User@Example.com  ', password: 'correcthorse' });

    expect(lookedUpWith).toBe('user@example.com');
  });
});
