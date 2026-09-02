import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const MAX_FIELD_LENGTH = 2000;
// Standard tier's publish radius cap (Boundaries & Constraints) — Premium
// has no defined parameters yet, so every Employer is capped here
// regardless of tier. Rejected with 400, never silently clamped.
const MAX_DISTRIBUTION_RADIUS_KM = 10;
const MIN_DISTRIBUTION_RADIUS_KM = 0.1;

// Trimmed before @IsNotEmpty runs — same reasoning as
// `profile/dto/save-profile.dto.ts`: a whitespace-only value ("   ")
// otherwise passes validation and gets persisted as if it were real content.
const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/**
 * Request DTO for `POST /me/listings` (AD-10 — OpenAPI generated from these
 * decorators, never hand-authored). Checked by the global `ValidationPipe`
 * (main.ts): an out-of-range latitude/longitude or a radius above the 10km
 * cap is rejected 400 before the use case (and therefore any DB write) is
 * ever reached (I/O matrix).
 */
export class CreateListingDto {
  @ApiProperty({ type: String, maxLength: MAX_FIELD_LENGTH })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_FIELD_LENGTH)
  title!: string;

  @ApiProperty({ type: String, example: 'Lyon', maxLength: MAX_FIELD_LENGTH })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_FIELD_LENGTH)
  location!: string;

  @ApiProperty({ type: String, maxLength: MAX_FIELD_LENGTH })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_FIELD_LENGTH)
  description!: string;

  @ApiProperty({ type: Number })
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ type: Number })
  @IsLongitude()
  longitude!: number;

  @ApiProperty({ type: Number, minimum: MIN_DISTRIBUTION_RADIUS_KM, maximum: MAX_DISTRIBUTION_RADIUS_KM })
  @IsNumber()
  @Min(MIN_DISTRIBUTION_RADIUS_KM)
  @Max(MAX_DISTRIBUTION_RADIUS_KM)
  distributionRadiusKm!: number;
}
