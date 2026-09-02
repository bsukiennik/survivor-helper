import { ApiProperty } from '@nestjs/swagger';
import {
  LISTING_STATUSES,
  type Listing,
  type ListingStatus,
} from '../../../domain/listing/listing.entity.js';

/**
 * Response DTO for `POST /me/listings` (AD-10 — OpenAPI generated from
 * these decorators, never hand-authored). Same field-shape convention as
 * `listing.dto.ts` (the public `GET /listings` DTO), plus the
 * Employer-only fields (`employerId`, `distributionRadiusKm`, `createdAt`)
 * that response never exposes.
 */
export class MyListingResponseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String })
  title!: string;

  @ApiProperty({ type: String, format: 'uuid' })
  employerId!: string;

  @ApiProperty({ type: String })
  employerName!: string;

  @ApiProperty({ type: String, example: 'Lyon' })
  location!: string;

  @ApiProperty({ type: String })
  description!: string;

  @ApiProperty({ type: Number })
  latitude!: number;

  @ApiProperty({ type: Number })
  longitude!: number;

  @ApiProperty({ type: Number })
  distributionRadiusKm!: number;

  @ApiProperty({ type: String, enum: LISTING_STATUSES })
  status!: ListingStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  static fromDomain(listing: Listing): MyListingResponseDto {
    const dto = new MyListingResponseDto();
    dto.id = listing.id;
    dto.title = listing.title;
    dto.employerId = listing.employerId;
    dto.employerName = listing.employerName;
    dto.location = listing.location;
    dto.description = listing.description;
    dto.latitude = listing.latitude;
    dto.longitude = listing.longitude;
    dto.distributionRadiusKm = listing.distributionRadiusKm;
    dto.status = listing.status;
    dto.createdAt = listing.createdAt.toISOString();
    return dto;
  }
}
