import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { JobSeekerProfileRepositoryPort } from '../../../application/ports/job-seeker-profile-repository.port.js';
import type { JobSeekerProfile } from '../../../domain/profile/job-seeker-profile.entity.js';
import { getDb } from './db.js';
import { jobSeekerProfilesTable } from './job-seeker-profile.schema.js';

@Injectable()
export class DrizzleJobSeekerProfileRepository implements JobSeekerProfileRepositoryPort {
  async findByAccountId(accountId: string): Promise<JobSeekerProfile | null> {
    const rows = await getDb()
      .select()
      .from(jobSeekerProfilesTable)
      .where(eq(jobSeekerProfilesTable.accountId, accountId))
      .limit(1);

    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  // Single upsert statement (not select-then-insert-or-update) — `accountId`
  // is the primary key, so a conflict on it is exactly "this account already
  // has a profile row".
  async upsert(input: {
    accountId: string;
    skills: string;
    experience: string;
    availability: string;
  }): Promise<JobSeekerProfile> {
    const now = new Date();
    const [row] = await getDb()
      .insert(jobSeekerProfilesTable)
      .values({
        accountId: input.accountId,
        skills: input.skills,
        experience: input.experience,
        availability: input.availability,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: jobSeekerProfilesTable.accountId,
        set: {
          skills: input.skills,
          experience: input.experience,
          availability: input.availability,
          updatedAt: now,
        },
      })
      .returning();

    return this.toDomain(row);
  }

  private toDomain(row: typeof jobSeekerProfilesTable.$inferSelect): JobSeekerProfile {
    return {
      accountId: row.accountId,
      skills: row.skills,
      experience: row.experience,
      availability: row.availability,
      updatedAt: row.updatedAt,
    };
  }
}
