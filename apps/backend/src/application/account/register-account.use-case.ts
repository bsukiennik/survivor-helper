import { Inject, Injectable } from '@nestjs/common';
import type { AccountRole } from '../../domain/account/account.entity.js';
import { EmailAlreadyRegisteredError } from '../../domain/account/email-already-registered.error.js';
import {
  ACCOUNT_REPOSITORY_PORT,
  type AccountRepositoryPort,
} from '../ports/account-repository.port.js';
import {
  EMPLOYER_PROFILE_REPOSITORY_PORT,
  type EmployerProfileRepositoryPort,
} from '../ports/employer-profile-repository.port.js';
import { PASSWORD_HASHER_PORT, type PasswordHasherPort } from '../ports/password-hasher.port.js';
import { TOKEN_ISSUER_PORT, type TokenIssuerPort } from '../ports/token-issuer.port.js';

export interface RegisterAccountInput {
  email: string;
  password: string;
  role: AccountRole;
  // Present only for an Employer registration (Story 3.1) — when set, an
  // `employer_profiles` row is created alongside the `accounts` row.
  // JobSeeker registrations (Story 2.1) leave this undefined.
  employerProfile?: { companyName: string };
}

export interface RegisterAccountResult {
  accessToken: string;
}

/**
 * The single shared account-provisioning use case (AD-13) — the only code
 * that inserts an `accounts` row, for every role. Story 2.1's controller
 * always passes `role = 'JobSeeker'` with `employerProfile` undefined;
 * Story 3.1's `POST /auth/register/employer` passes `role = 'Employer'`
 * plus `employerProfile: { companyName }`.
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
    @Inject(EMPLOYER_PROFILE_REPOSITORY_PORT)
    private readonly employerProfileRepository: EmployerProfileRepositoryPort,
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

    // Everything from here on can fail after the account row already
    // exists — a failure at any step (profile creation, token issuance)
    // would otherwise leave an unusable "phantom" account with no way to
    // sign in, so every step past account creation shares one rollback.
    let employerProfileCreated = false;
    try {
      if (input.employerProfile) {
        await this.employerProfileRepository.create({
          accountId: account.id,
          companyName: input.employerProfile.companyName,
        });
        employerProfileCreated = true;
      }

      const accessToken = await this.tokenIssuer.issue(account);
      return { accessToken };
    } catch (error) {
      // `employer_profiles.accountId` has no `onDelete` cascade (same
      // known/deferred constraint `job_seeker_profiles` has), so the profile
      // row — only if it was actually created — must be deleted before the
      // account row, or the delete below would raise a FK violation instead
      // of cleanly rolling back.
      if (employerProfileCreated) {
        await this.employerProfileRepository.delete(account.id);
      }
      await this.accountRepository.delete(account.id);
      throw error;
    }
  }
}
