import type { ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { describe, expect, it } from 'vitest';
import type { AuthenticatedUser } from './jwt-auth.guard.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

function makeContext(options: {
  authorizationHeader?: string;
}): { context: ExecutionContext; request: { user?: AuthenticatedUser } } {
  const request: { headers: Record<string, string>; user?: AuthenticatedUser } = {
    headers: options.authorizationHeader ? { authorization: options.authorizationHeader } : {},
  };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

function makeJwtService(
  verify: (token: string) => Promise<{ sub: string; role: string }>,
): JwtService {
  return { verifyAsync: verify } as unknown as JwtService;
}

describe('JwtAuthGuard', () => {
  it('rejects with 401 when no bearer token is present', async () => {
    const guard = new JwtAuthGuard(
      makeJwtService(async () => {
        throw new Error('should not be called');
      }),
    );
    const { context } = makeContext({});

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects with 401 when the token fails verification', async () => {
    const guard = new JwtAuthGuard(
      makeJwtService(async () => {
        throw new Error('invalid signature');
      }),
    );
    const { context } = makeContext({ authorizationHeader: 'Bearer bad-token' });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('allows the request through and attaches request.user for a valid token', async () => {
    const guard = new JwtAuthGuard(
      makeJwtService(async () => ({ sub: 'account-1', role: 'JobSeeker' })),
    );
    const { context, request } = makeContext({ authorizationHeader: 'Bearer valid-token' });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual({ id: 'account-1', role: 'JobSeeker' });
  });
});
