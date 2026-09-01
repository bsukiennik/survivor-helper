import { Inject, Injectable } from '@nestjs/common';
import type { AccountRole } from '../../domain/account/account.entity.js';
import { EmailAlreadyRegisteredError } from '../../domain/account/email-already-registered.error.js';
import {
  ACCOUNT_REPOSITORY_PORT,
  type AccountRepositoryPort,
} from '../ports/account-repository.port.js';
import { PASSWORD_HASHER_PORT, type PasswordHasherPort } from '../ports/password-hasher.port.js';
import { TOKEN_ISSUER_PORT, type TokenIssuerPort } from '../ports/token-issuer.port.js';

export interface RegisterAccountInput {
  email: string;
  password: string;
  role: AccountRole;
}

export interface RegisterAccountResult {
  accessToken: string;
}

/**
 * The single shared account-provisioning use case (AD-13) — the only code
 * that inserts an `accounts` row, for every role. Story 2.1's controller is
 * the only current caller and always passes `role = 'JobSeeker'`; Story 3.1
 * (Employer) and the Epic 5 admin-bootstrap path call this verbatim with a
 * different role.
 */
@Injectable()
export class RegisterAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasherPort,
    @Inject(TOKEN_ISSUER_PORT)
    private readonly tokenIssuer: TokenIssuerPort,
  ) {}

  async execute(input: RegisterAccountInput): Promise<RegisterAccountResult> {
    // Trimmed + lowercased so "User@Example.com" and "user@example.com "
    // are the same account, not two — applied consistently with LoginUseCase.
    const email = input.email.trim().toLowerCase();

    const existing = await this.accountRepository.findByEmail(email);
    if (existing) {
      throw new EmailAlreadyRegisteredError(email);
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const account = await this.accountRepository.create({
      email,
      passwordHash,
      role: input.role,
    });

    try {
      const accessToken = await this.tokenIssuer.issue(account);
      return { accessToken };
    } catch (error) {
      // Token issuance failing after the account was created would leave an
      // unusable "phantom" account with no way to sign in — roll it back.
      await this.accountRepository.delete(account.id);
      throw error;
    }
  }
}
