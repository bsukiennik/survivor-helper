import { ApiProperty } from '@nestjs/swagger';
import {
  LISTING_STATUSES,
  type Listing,
  type ListingStatus,
} from '../../../domain/listing/listing.entity.js';

/**
 * Response DTO for `GET /listings` (AD-10 — OpenAPI generated from these
 * decorators, never hand-authored).
 */
export class ListingDto {
  // `type` is passed explicitly on every property rather than relied on via
  // reflected `design:type` metadata — under NestJS 12's ESM/NodeNext build
  // (no CLI Swagger plugin in this scaffold) that reflection is unreliable
  // and produces spurious "circular dependency" errors at boot.
  @ApiProperty({ type: String, format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String })
  title!: string;

  @ApiProperty({ type: String })
  employerName!: string;

  @ApiProperty({ type: String })
  description!: string;

  @ApiProperty({ type: Number })
  latitude!: number;

  @ApiProperty({ type: Number })
  longitude!: number;

  @ApiProperty({ type: String, enum: LISTING_STATUSES })
  status!: ListingStatus;

  static fromDomain(listing: Listing): ListingDto {
    const dto = new ListingDto();
    dto.id = listing.id;
    dto.title = listing.title;
    dto.employerName = listing.employerName;
    dto.description = listing.description;
    dto.latitude = listing.latitude;
    dto.longitude = listing.longitude;
    dto.status = listing.status;
    return dto;
  }
}
