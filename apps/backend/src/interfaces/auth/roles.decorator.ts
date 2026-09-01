import { SetMetadata } from '@nestjs/common';
import type { AccountRole } from '../../domain/account/account.entity.js';

export const ROLES_KEY = 'roles';

/**
 * AD-15 — marks a route/handler as requiring one of the given roles.
 * Paired with `RolesGuard`. No route uses this yet in this story (no
 * Employer/Admin route exists to guard) — `roles.guard.spec.ts` proves the
 * guard against a mocked `ExecutionContext` instead.
 */
export const Roles = (...roles: AccountRole[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(ROLES_KEY, roles);
