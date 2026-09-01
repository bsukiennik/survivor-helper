/**
 * Port (AD-1) — the domain/application layer never imports a hashing
 * library directly. Concrete implementation: `bcrypt-password-hasher.adapter.ts`.
 */
export interface PasswordHasherPort {
  hash(plainTextPassword: string): Promise<string>;
  compare(plainTextPassword: string, passwordHash: string): Promise<boolean>;
}

export const PASSWORD_HASHER_PORT = Symbol('PASSWORD_HASHER_PORT');
