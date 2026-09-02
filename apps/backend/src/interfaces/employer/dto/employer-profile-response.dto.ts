import { ApiProperty } from '@nestjs/swagger';
import type { EmployerProfile } from '../../../domain/profile/employer-profile.entity.js';

/**
 * Response DTO for `GET /me/employer-profile` (AD-10 — OpenAPI generated
 * from these decorators, never hand-authored).
 *
 * `verificationStatus` is returned verbatim as the raw string
 * (`'pending' | 'verified'`), not mapped to a boolean — matches the
 * `Application.status` convention from Story 2.5 (spec Boundaries &
 * Constraints).
 */
export class EmployerProfileResponseDto {
  @ApiProperty({ type: String })
  companyName!: string;

  @ApiProperty({ type: String, enum: ['pending', 'verified'] })
  verificationStatus!: string;

  static fromDomain(profile: EmployerProfile): EmployerProfileResponseDto {
    const dto = new EmployerProfileResponseDto();
    dto.companyName = profile.companyName;
    dto.verificationStatus = profile.verificationStatus;
    return dto;
  }
}
