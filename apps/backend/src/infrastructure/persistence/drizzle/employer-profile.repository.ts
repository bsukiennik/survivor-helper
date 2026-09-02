import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { EmployerProfileRepositoryPort } from '../../../application/ports/employer-profile-repository.port.js';
import type { EmployerProfile } from '../../../domain/profile/employer-profile.entity.js';
import { getDb } from './db.js';
import { employerProfilesTable } from './employer-profile.schema.js';

@Injectable()
export class DrizzleEmployerProfileRepository implements EmployerProfileRepositoryPort {
  async findByAccountId(accountId: string): Promise<EmployerProfile | null> {
    const rows = await getDb()
      .select()
      .from(employerProfilesTable)
      .where(eq(employerProfilesTable.accountId, accountId))
      .limit(1);

    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  // `verificationStatus` isn't accepted here — it always defaults to
  // `'pending'` at creation (the schema default); flipping it to `'verified'`
  // is a manual admin action (Epic 5, not yet built) that this story only
  // ever exercises by seeding the row directly in tests.
  async create(input: { accountId: string; companyName: string }): Promise<EmployerProfile> {
    const [row] = await getDb()
      .insert(employerProfilesTable)
      .values({
        accountId: input.accountId,
        companyName: input.companyName,
      })
      .returning();

    return this.toDomain(row);
  }

  async delete(accountId: string): Promise<void> {
    await getDb().delete(employerProfilesTable).where(eq(employerProfilesTable.accountId, accountId));
  }

  private toDomain(row: typeof employerProfilesTable.$inferSelect): EmployerProfile {
    return {
      accountId: row.accountId,
      companyName: row.companyName,
      verificationStatus: row.verificationStatus,
    };
  }
}
