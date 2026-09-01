/**
 * Domain error — zero framework/infrastructure imports (AD-1). Raised by
 * `RegisterAccountUseCase` when the requested email is already taken;
 * `interfaces/auth/auth.controller.ts` maps this to HTTP 409.
 */
export class EmailAlreadyRegisteredError extends Error {
  constructor(email: string) {
    super(`An account with email "${email}" already exists.`);
    this.name = 'EmailAlreadyRegisteredError';
  }
}
