/**
 * Domain error — zero framework/infrastructure imports (AD-1). Raised by
 * `LoginUseCase` for both "no such email" and "wrong password" — the
 * message is deliberately generic (I/O matrix, spec-2-1) so a caller can
 * never tell which field was wrong. `interfaces/auth/auth.controller.ts`
 * maps this to HTTP 401.
 */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials.');
    this.name = 'InvalidCredentialsError';
  }
}
