import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import type { AuthenticatedUser } from './jwt-auth.guard.js';
import { RolesGuard } from './roles.guard.js';

function makeContext(options: { user?: AuthenticatedUser }): ExecutionContext {
  const request: { user?: AuthenticatedUser } = { user: options.user };
  return {
    getHandler: () => ({}) as unknown,
    getClass: () => ({}) as unknown,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function makeReflector(requiredRoles: string[] | undefined): Reflector {
  return { getAllAndOverride: () => requiredRoles } as unknown as Reflector;
}

describe('RolesGuard', () => {
  it('allows the request through when the route has no @Roles() requirement', () => {
    const guard = new RolesGuard(makeReflector(undefined));

    const result = guard.canActivate(makeContext({}));

    expect(result).toBe(true);
  });

  it('denies access when a JobSeeker role is evaluated against an Administrator-only route', () => {
    const guard = new RolesGuard(makeReflector(['Administrator']));

    expect(() =>
      guard.canActivate(
        makeContext({ user: { id: 'account-1', role: 'JobSeeker' } }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows access when the token role matches a required role', () => {
    const guard = new RolesGuard(makeReflector(['JobSeeker']));

    const result = guard.canActivate(
      makeContext({ user: { id: 'account-1', role: 'JobSeeker' } }),
    );

    expect(result).toBe(true);
  });

  it('rejects with 401 when no request.user is present but the route requires a role (JwtAuthGuard did not run first)', () => {
    const guard = new RolesGuard(makeReflector(['Administrator']));

    expect(() => guard.canActivate(makeContext({}))).toThrow(UnauthorizedException);
  });
});
