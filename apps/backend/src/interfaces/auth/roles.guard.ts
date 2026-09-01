import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AccountRole } from '../../domain/account/account.entity.js';
import { ROLES_KEY } from './roles.decorator.js';

interface JwtPayload {
  sub: string;
  role: AccountRole;
}

/**
 * AD-15 — denies access unless the bearer token's `role` claim is one of the
 * roles required by `@Roles(...)` on the handler/class. No route uses this
 * yet (no Employer/Admin route exists in this story) — proven by
 * `roles.guard.spec.ts` against a mocked `ExecutionContext`/`JwtService`
 * instead of a live protected route.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<AccountRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // No @Roles() on this handler/class — nothing to guard.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

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

    if (!requiredRoles.includes(payload.role)) {
      throw new ForbiddenException('Insufficient role for this route');
    }

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
