import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { AccountRepositoryPort } from '../../../application/ports/account-repository.port.js';
import type { Account } from '../../../domain/account/account.entity.js';
import { EmailAlreadyRegisteredError } from '../../../domain/account/email-already-registered.error.js';
import { accountsTable } from './account.schema.js';
import { getDb } from './db.js';

// Postgres error code for a unique-constraint violation. Used as a
// last-resort backstop against a check-then-insert race between two
// concurrent registrations for the same email (RegisterAccountUseCase
// already checks findByEmail first) — the DB's unique index is the real
// source of truth.
const PG_UNIQUE_VIOLATION = '23505';

// drizzle-orm wraps the real `pg` driver error (which carries `.code`) in a
// `DrizzleQueryError` whose `.cause` is that driver error — `.code` itself
// is not present on the outer error.
function isUniqueViolation(error: unknown): boolean {
  const cause = error instanceof Error ? error.cause : undefined;
  return (
    !!cause &&
    typeof cause === 'object' &&
    'code' in cause &&
    cause.code === PG_UNIQUE_VIOLATION
  );
}

@Injectable()
export class DrizzleAccountRepository implements AccountRepositoryPort {
  async findByEmail(email: string): Promise<Account | null> {
    const rows = await getDb()
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.email, email))
      .limit(1);

    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  async create(input: {
    email: string;
    passwordHash: string;
    role: Account['role'];
  }): Promise<Account> {
    try {
      const [row] = await getDb()
        .insert(accountsTable)
        .values({
          email: input.email,
          passwordHash: input.passwordHash,
          role: input.role,
        })
        .returning();

      return this.toDomain(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new EmailAlreadyRegisteredError(input.email);
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await getDb().delete(accountsTable).where(eq(accountsTable.id, id));
  }

  private toDomain(row: typeof accountsTable.$inferSelect): Account {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role,
      createdAt: row.createdAt,
    };
  }
}
