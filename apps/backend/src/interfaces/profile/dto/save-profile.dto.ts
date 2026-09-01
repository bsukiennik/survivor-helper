import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const MAX_FIELD_LENGTH = 2000;

// Trimmed before @IsNotEmpty runs — otherwise a whitespace-only value
// ("   ") passes validation and gets persisted as if it were real content.
const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/**
 * Request DTO for `PUT /me/profile` (AD-10 — OpenAPI generated from these
 * decorators, never hand-authored). Checked by the global `ValidationPipe`
 * (main.ts) — all three fields required (I/O matrix): an incomplete save is
 * rejected 400, nothing persisted.
 */
export class SaveProfileDto {
  @ApiProperty({ type: String, maxLength: MAX_FIELD_LENGTH })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_FIELD_LENGTH)
  skills!: string;

  @ApiProperty({ type: String, maxLength: MAX_FIELD_LENGTH })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_FIELD_LENGTH)
  experience!: string;

  @ApiProperty({ type: String, maxLength: MAX_FIELD_LENGTH })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_FIELD_LENGTH)
  availability!: string;
}
