import { ApiProperty } from '@nestjs/swagger';
import type { JobSeekerProfile } from '../../../domain/profile/job-seeker-profile.entity.js';

/**
 * Response DTO for both `GET` and `PUT /me/profile` (AD-10 — OpenAPI
 * generated from these decorators, never hand-authored).
 *
 * A fresh account with no profile row yet is not an error (I/O matrix) — all
 * fields come back `null` rather than the route 404ing.
 */
export class ProfileResponseDto {
  @ApiProperty({ type: String, nullable: true })
  skills!: string | null;

  @ApiProperty({ type: String, nullable: true })
  experience!: string | null;

  @ApiProperty({ type: String, nullable: true })
  availability!: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  updatedAt!: string | null;

  static fromDomain(profile: JobSeekerProfile | null): ProfileResponseDto {
    const dto = new ProfileResponseDto();
    dto.skills = profile?.skills ?? null;
    dto.experience = profile?.experience ?? null;
    dto.availability = profile?.availability ?? null;
    dto.updatedAt = profile?.updatedAt.toISOString() ?? null;
    return dto;
  }
}
