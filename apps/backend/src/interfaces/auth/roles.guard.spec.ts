import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { JwtService } from '@nestjs/jwt';
import { describe, expect, it } from 'vitest';
import { RolesGuard } from './roles.guard.js';

function makeContext(options: {
  requiredRoles?: string[];
  authorizationHeader?: string;
}): ExecutionContext {
  const request = {
    headers: options.authorizationHeader ? { authorization: options.authorizationHeader } : {},
  };
  return {
    getHandler: () => ({}) as unknown,
    getClass: () => ({}) as unknown,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function makeReflector(requiredRoles: string[] | undefined): Reflector {
  return { getAllAndOverride: () => requiredRoles } as unknown as Reflector;
}

function makeJwtService(
  verify: (token: string) => Promise<{ sub: string; role: string }>,
): JwtService {
  return { verifyAsync: verify } as unknown as JwtService;
}

describe('RolesGuard', () => {
  it('allows the request through when the route has no @Roles() requirement', async () => {
    const guard = new RolesGuard(makeReflector(undefined), makeJwtService(async () => {
      throw new Error('should not be called');
    }));

    const result = await guard.canActivate(makeContext({}));

    expect(result).toBe(true);
  });

  it('denies access when a JobSeeker role is evaluated against an Administrator-only route', async () => {
    const guard = new RolesGuard(
      makeReflector(['Administrator']),
      makeJwtService(async () => ({ sub: 'account-1', role: 'JobSeeker' })),
    );

    await expect(
      guard.canActivate(makeContext({ requiredRoles: ['Administrator'], authorizationHeader: 'Bearer valid-token' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows access when the token role matches a required role', async () => {
    const guard = new RolesGuard(
      makeReflector(['JobSeeker']),
      makeJwtService(async () => ({ sub: 'account-1', role: 'JobSeeker' })),
    );

    const result = await guard.canActivate(
      makeContext({ requiredRoles: ['JobSeeker'], authorizationHeader: 'Bearer valid-token' }),
    );

    expect(result).toBe(true);
  });

  it('rejects with 401 when no bearer token is present but the route requires a role', async () => {
    const guard = new RolesGuard(
      makeReflector(['Administrator']),
      makeJwtService(async () => ({ sub: 'account-1', role: 'JobSeeker' })),
    );

    await expect(guard.canActivate(makeContext({ requiredRoles: ['Administrator'] }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects with 401 when the token fails verification', async () => {
    const guard = new RolesGuard(
      makeReflector(['Administrator']),
      makeJwtService(async () => {
        throw new Error('invalid signature');
      }),
    );

    await expect(
      guard.canActivate(
        makeContext({ requiredRoles: ['Administrator'], authorizationHeader: 'Bearer bad-token' }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
