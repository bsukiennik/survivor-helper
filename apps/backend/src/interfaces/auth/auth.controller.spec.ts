import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import type { LoginUseCase } from '../../application/account/login.use-case.js';
import type { RegisterAccountUseCase } from '../../application/account/register-account.use-case.js';
import { EmailAlreadyRegisteredError } from '../../domain/account/email-already-registered.error.js';
import { InvalidCredentialsError } from '../../domain/account/invalid-credentials.error.js';
import { AuthController } from './auth.controller.js';

function makeRegisterUseCaseStub(
  impl: RegisterAccountUseCase['execute'],
): RegisterAccountUseCase {
  return { execute: impl } as unknown as RegisterAccountUseCase;
}

function makeLoginUseCaseStub(impl: LoginUseCase['execute']): LoginUseCase {
  return { execute: impl } as unknown as LoginUseCase;
}

describe('AuthController', () => {
  describe('register', () => {
    it('always registers with role JobSeeker and returns the access token', async () => {
      let receivedInput: unknown;
      const controller = new AuthController(
        makeRegisterUseCaseStub(async (input) => {
          receivedInput = input;
          return { accessToken: 'signed-token' };
        }),
        makeLoginUseCaseStub(async () => ({ accessToken: '' })),
      );

      const result = await controller.register({ email: 'a@b.com', password: 'correcthorse' });

      expect(result).toEqual({ accessToken: 'signed-token' });
      expect(receivedInput).toEqual({
        email: 'a@b.com',
        password: 'correcthorse',
        role: 'JobSeeker',
      });
    });

    it('maps a duplicate email to a 409 Conflict', async () => {
      const controller = new AuthController(
        makeRegisterUseCaseStub(async () => {
          throw new EmailAlreadyRegisteredError('a@b.com');
        }),
        makeLoginUseCaseStub(async () => ({ accessToken: '' })),
      );

      await expect(
        controller.register({ email: 'a@b.com', password: 'correcthorse' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('loginRoute', () => {
    it('returns the access token on valid credentials', async () => {
      const controller = new AuthController(
        makeRegisterUseCaseStub(async () => ({ accessToken: '' })),
        makeLoginUseCaseStub(async () => ({ accessToken: 'signed-token' })),
      );

      const result = await controller.loginRoute({ email: 'a@b.com', password: 'correcthorse' });

      expect(result).toEqual({ accessToken: 'signed-token' });
    });

    it('maps invalid credentials to a 401 Unauthorized', async () => {
      const controller = new AuthController(
        makeRegisterUseCaseStub(async () => ({ accessToken: '' })),
        makeLoginUseCaseStub(async () => {
          throw new InvalidCredentialsError();
        }),
      );

      await expect(
        controller.loginRoute({ email: 'a@b.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
