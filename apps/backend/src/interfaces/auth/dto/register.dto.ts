import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Request DTO for `POST /auth/register` (AD-10 — OpenAPI generated from
 * these decorators, never hand-authored). Checked by the global
 * `ValidationPipe` (main.ts).
 */
export class RegisterDto {
  // Trimmed *before* @IsEmail runs — otherwise a pasted email with
  // surrounding whitespace fails validation outright (400) instead of
  // being accepted, since class-validator's email check rejects padding.
  @ApiProperty({ type: String, format: 'email' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail()
  email!: string;

  // bcrypt silently truncates input past 72 bytes — capping here means the
  // password a user typed is the one actually checked, not a truncated one.
  @ApiProperty({ type: String, minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
