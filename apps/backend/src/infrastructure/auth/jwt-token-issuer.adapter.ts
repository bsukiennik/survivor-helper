import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { TokenIssuerPort } from '../../application/ports/token-issuer.port.js';
import type { Account } from '../../domain/account/account.entity.js';

/**
 * Bearer JWT, no session store (AD-4). `sub` claim = `accounts.id`; `role`
 * is also embedded so `RolesGuard` (interfaces/auth/roles.guard.ts) can
 * authorize without a DB round-trip per request.
 */
@Injectable()
export class JwtTokenIssuerAdapter implements TokenIssuerPort {
  constructor(private readonly jwtService: JwtService) {}

  async issue(account: Pick<Account, 'id' | 'role'>): Promise<string> {
    return this.jwtService.signAsync({ sub: account.id, role: account.role });
  }
}
