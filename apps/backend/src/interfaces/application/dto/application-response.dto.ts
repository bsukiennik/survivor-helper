import { ApiProperty } from '@nestjs/swagger';
import type { ApplyToListingResult } from '../../../application/application/apply-to-listing.use-case.js';

/**
 * Response DTO for `POST /me/applications` (AD-10). `id`, `catchCount`, and
 * `permisDeTravailUnlocked` are all `null`/`false` on the no-op
 * (already-caught) path — `onConflictDoNothing()` returns no row, so there
 * is nothing freshly created (or freshly counted) to hand back;
 * `alreadyApplied` is what the frontend actually branches on (I/O matrix).
 *
 * `catchCount`/`permisDeTravailUnlocked` are Story 2.4 — always derived
 * live from the just-recomputed count, never stored (Boundaries &
 * Constraints, Never).
 */
export class ApplicationResponseDto {
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  id!: string | null;

  @ApiProperty({ type: String, format: 'uuid' })
  listingId!: string;

  @ApiProperty({ type: Boolean })
  alreadyApplied!: boolean;

  @ApiProperty({ type: Number, nullable: true })
  catchCount!: number | null;

  @ApiProperty({ type: Boolean })
  permisDeTravailUnlocked!: boolean;

  static fromResult(
    result: ApplyToListingResult | null,
    listingId: string,
  ): ApplicationResponseDto {
    const dto = new ApplicationResponseDto();
    dto.id = result?.application.id ?? null;
    dto.listingId = listingId;
    dto.alreadyApplied = result === null;
    dto.catchCount = result?.catchCount ?? null;
    dto.permisDeTravailUnlocked = result?.permisDeTravailUnlocked ?? false;
    return dto;
  }
}
