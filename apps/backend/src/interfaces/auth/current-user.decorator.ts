import {
  createParamDecorator,
  InternalServerErrorException,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from './jwt-auth.guard.js';

/**
 * Reads `request.user` back out (set by `JwtAuthGuard`). Only valid on a
 * route guarded by `JwtAuthGuard` — using it without that guard is a coding
 * error, not a runtime/user-facing condition, so it throws rather than
 * quietly returning `undefined`. Uses a Nest `HttpException` (not a plain
 * `Error`) so a future route that forgets the guard still fails as a clean
 * 500 through Nest's exception filter, not an unhandled crash.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    if (!request.user) {
      throw new InternalServerErrorException(
        '@CurrentUser() used on a route without JwtAuthGuard',
      );
    }
    return request.user;
  },
);
