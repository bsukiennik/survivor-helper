import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AccountRole } from '../../domain/account/account.entity.js';
import type { AuthenticatedUser } from './jwt-auth.guard.js';
import { ROLES_KEY } from './roles.decorator.js';

/**
 * AD-15 — denies access unless `request.user.role` is one of the roles
 * required by `@Roles(...)` on the handler/class.
 *
 * Story 2.2 refactor: this used to verify the bearer JWT itself. It now
 * assumes `JwtAuthGuard` already ran and set `request.user` — a route
 * needing both stacks `@UseGuards(JwtAuthGuard, RolesGuard)`, so a request
 * is only ever decoded once. No route uses this yet (no Employer/Admin
 * route exists in this story) — proven by `roles.guard.spec.ts` against a
 * mocked `ExecutionContext` instead of a live protected route.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AccountRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // No @Roles() on this handler/class — nothing to guard.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) {
      // Only reachable if RolesGuard is stacked without JwtAuthGuard ahead
      // of it — a route-wiring mistake, but surfaced as 401 rather than a
      // 500 since "no verified identity" is exactly what 401 means.
      throw new UnauthorizedException(
        'Missing authenticated user — is JwtAuthGuard applied before RolesGuard?',
      );
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient role for this route');
    }

    return true;
  }
}
