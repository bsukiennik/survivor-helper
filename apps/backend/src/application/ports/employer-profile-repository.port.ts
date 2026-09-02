import type { EmployerProfile } from '../../domain/profile/employer-profile.entity.js';

/**
 * Port (AD-1) — the domain/application layer depends on this interface only.
 * The concrete implementation lives behind `infrastructure/persistence/drizzle`.
 *
 * Only `create`/`findByAccountId`/`delete` — no `upsert` like
 * `JobSeekerProfileRepositoryPort`, since the profile is written once at
 * registration (`RegisterAccountUseCase`), never edited afterward in this
 * story. `delete` exists solely to support that use case's
 * token-issuance-failure rollback (see `register-account.use-case.ts`), not
 * as a general profile-deletion path.
 */
export interface EmployerProfileRepositoryPort {
  findByAccountId(accountId: string): Promise<EmployerProfile | null>;
  create(input: { accountId: string; companyName: string }): Promise<EmployerProfile>;
  delete(accountId: string): Promise<void>;
}

export const EMPLOYER_PROFILE_REPOSITORY_PORT = Symbol('EMPLOYER_PROFILE_REPOSITORY_PORT');
