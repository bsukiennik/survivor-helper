import { Inject, Injectable } from '@nestjs/common';
import { InvalidCredentialsError } from '../../domain/account/invalid-credentials.error.js';
import {
  ACCOUNT_REPOSITORY_PORT,
  type AccountRepositoryPort,
} from '../ports/account-repository.port.js';
import { PASSWORD_HASHER_PORT, type PasswordHasherPort } from '../ports/password-hasher.port.js';
import { TOKEN_ISSUER_PORT, type TokenIssuerPort } from '../ports/token-issuer.port.js';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
}

/**
 * Verifies credentials and issues a token — the "way back in" half of AD-4's
 * bearer-JWT auth, since a registration-only flow with no login isn't usable.
 */
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(TOKEN_ISSUER_PORT)
    private readonly tokenIssuer: TokenIssuerPort,
  ) {}

  async execute(input: LoginInput): Promise<LoginResult> {
    // Same normalization as RegisterAccountUseCase — otherwise a user who
    // registered as "User@Example.com" can never log back in with a
    // differently-cased or padded entry of the same address.
    const email = input.email.trim().toLowerCase();
    const account = await this.accountRepository.findByEmail(email);
    if (!account) {
      // Never reveal whether the email itself was registered.
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await this.passwordHasher.compare(
      input.password,
      account.passwordHash,
    );
    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const accessToken = await this.tokenIssuer.issue(account);
    return { accessToken };
  }
}
