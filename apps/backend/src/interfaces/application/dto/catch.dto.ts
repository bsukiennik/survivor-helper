import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/**
 * Request DTO for `POST /me/applications` (AD-10 — OpenAPI generated from
 * these decorators, never hand-authored). A malformed `listingId` is
 * rejected 400 by the global `ValidationPipe` before this ever reaches the
 * use case — the "unknown listing" 404 in the I/O matrix is for a
 * well-formed UUID that doesn't match any row.
 */
export class CatchDto {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  listingId!: string;
}
