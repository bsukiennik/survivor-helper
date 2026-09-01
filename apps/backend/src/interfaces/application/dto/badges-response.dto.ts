import { ApiProperty } from '@nestjs/swagger';
import type { MyBadges } from '../../../application/application/get-my-badges.use-case.js';

/**
 * Response DTO for `GET /me/badges` (AD-10 — OpenAPI generated from these
 * decorators, never hand-authored).
 *
 * A fresh account with zero catches yet is not an error (I/O matrix) —
 * always 200 with `catchCount: 0, permisDeTravailUnlocked: false`.
 */
export class BadgesResponseDto {
  @ApiProperty({ type: Number })
  catchCount!: number;

  @ApiProperty({ type: Boolean })
  permisDeTravailUnlocked!: boolean;

  static fromDomain(badges: MyBadges): BadgesResponseDto {
    const dto = new BadgesResponseDto();
    dto.catchCount = badges.catchCount;
    dto.permisDeTravailUnlocked = badges.permisDeTravailUnlocked;
    return dto;
  }
}
