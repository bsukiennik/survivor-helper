import type { Account } from '../../domain/account/account.entity.js';

/**
 * Port (AD-1) — bearer JWT issuance, no session store (AD-4). Concrete
 * implementation: `jwt-token-issuer.adapter.ts`. `sub` claim is
 * `accounts.id`.
 */
export interface TokenIssuerPort {
  issue(account: Pick<Account, 'id' | 'role'>): Promise<string>;
}

export const TOKEN_ISSUER_PORT = Symbol('TOKEN_ISSUER_PORT');
