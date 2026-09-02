import { ApiProperty } from '@nestjs/swagger';
import type { MyApplicationRow } from '../../../application/ports/application-repository.port.js';

/**
 * One item of `GET /me/applications` (Story 2.5, AD-10 — OpenAPI generated
 * from these decorators). `status` is the raw persisted string, not an
 * enum — no status-to-label mapping in this story (Boundaries &
 * Constraints); Epic 3 may add values later with no schema change here.
 */
export class MyApplicationDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String, format: 'uuid' })
  listingId!: string;

  @ApiProperty({ type: String })
  listingTitle!: string;

  @ApiProperty({ type: String })
  employerName!: string;

  @ApiProperty({ type: String })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  static fromDomain(row: MyApplicationRow): MyApplicationDto {
    const dto = new MyApplicationDto();
    dto.id = row.id;
    dto.listingId = row.listingId;
    dto.listingTitle = row.listingTitle;
    dto.employerName = row.employerName;
    dto.status = row.status;
    dto.createdAt = row.createdAt.toISOString();
    return dto;
  }
}
