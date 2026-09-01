import { ApiProperty } from '@nestjs/swagger';
import type { Application } from '../../../domain/application/application.entity.js';

/**
 * Response DTO for `POST /me/applications` (AD-10). `id` is `null` on the
 * no-op (already-caught) path — `onConflictDoNothing()` returns no row, so
 * there is nothing freshly created to hand back an id for; `alreadyApplied`
 * is what the frontend actually branches on (I/O matrix).
 */
export class ApplicationResponseDto {
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  id!: string | null;

  @ApiProperty({ type: String, format: 'uuid' })
  listingId!: string;

  @ApiProperty({ type: Boolean })
  alreadyApplied!: boolean;

  static fromResult(application: Application | null, listingId: string): ApplicationResponseDto {
    const dto = new ApplicationResponseDto();
    dto.id = application?.id ?? null;
    dto.listingId = listingId;
    dto.alreadyApplied = application === null;
    return dto;
  }
}
