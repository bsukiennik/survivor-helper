import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

const MAX_COMPANY_NAME_LENGTH = 200;

// Trimmed before @IsNotEmpty runs — otherwise a whitespace-only value
// ("   ") passes validation and gets persisted as if it were real content
// (same reasoning as SaveProfileDto's trim transform).
const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/**
 * Request DTO for `POST /auth/register/employer` (AD-10 — OpenAPI generated
 * from these decorators, never hand-authored). Checked by the global
 * `ValidationPipe` (main.ts). A separate DTO/endpoint from `RegisterDto`
 * (not a conditional field on it) — see the spec's Boundaries & Constraints.
 */
export class RegisterEmployerDto {
  // Trimmed *before* @IsEmail runs — otherwise a pasted email with
  // surrounding whitespace fails validation outright (400) instead of
  // being accepted, matching RegisterDto.
  @ApiProperty({ type: String, format: 'email' })
  @Transform(trim)
  @IsEmail()
  email!: string;

  // bcrypt silently truncates input past 72 bytes — capping here means the
  // password a user typed is the one actually checked, not a truncated one.
  @ApiProperty({ type: String, minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @ApiProperty({ type: String, maxLength: MAX_COMPANY_NAME_LENGTH })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_COMPANY_NAME_LENGTH)
  companyName!: string;
}
