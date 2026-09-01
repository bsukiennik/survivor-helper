import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { ACCOUNT_ROLES, type AccountRole } from '../../domain/account/account.entity.js';

export interface AuthenticatedUser {
  id: string;
  role: AccountRole;
}

interface JwtPayload {
  sub: string;
  role: AccountRole;
}

/**
 * The "must be logged in" guard (Story 2.2) — answers "is there a valid
 * session at all", nothing about role. Verifies the bearer token and
 * attaches `request.user = { id, role }` (from the JWT's `sub`/`role`);
 * `@CurrentUser()` reads it back in controllers.
 *
 * `RolesGuard` (Story 2.1) now assumes this guard already ran and reads
 * `request.user` instead of re-verifying the JWT itself — a route needing
 * both stacks `@UseGuards(JwtAuthGuard, RolesGuard)`. `/me/profile` only
 * needs this one: any authenticated account manages its own profile row,
 * no role check at that layer.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // The token is cryptographically ours (verified above), but validate
    // its claims' shape anyway — a defensive net against a legacy/corrupted
    // payload shape rather than trusting `sub`/`role` blindly.
    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      throw new UnauthorizedException('Invalid token payload');
    }
    if (!ACCOUNT_ROLES.includes(payload.role)) {
      throw new UnauthorizedException('Invalid token payload');
    }

    (request as Request & { user?: AuthenticatedUser }).user = {
      id: payload.sub,
      role: payload.role,
    };
    return true;
  }

  private extractBearerToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return undefined;
    }
    return header.slice('Bearer '.length);
  }
}
