import type { Account, AccountRole } from '../../domain/account/account.entity.js';

/**
 * Port (AD-1) — the domain/application layer depends on this interface only.
 * The concrete implementation lives behind `infrastructure/persistence/drizzle`.
 *
 * This is the only way any use case reads/writes an `accounts` row — the
 * single shared provisioning path (AD-13).
 */
export interface AccountRepositoryPort {
  findByEmail(email: string): Promise<Account | null>;
  create(input: { email: string; passwordHash: string; role: AccountRole }): Promise<Account>;
  // Used to roll back a just-created account if token issuance fails right
  // after (RegisterAccountUseCase) — not a general account-deletion path.
  delete(id: string): Promise<void>;
}

export const ACCOUNT_REPOSITORY_PORT = Symbol('ACCOUNT_REPOSITORY_PORT');
