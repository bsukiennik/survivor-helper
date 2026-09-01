import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * Request DTO for `POST /auth/login` (AD-10 — OpenAPI generated from these
 * decorators, never hand-authored). Checked by the global `ValidationPipe`
 * (main.ts).
 */
export class LoginDto {
  // See RegisterDto — trimmed before @IsEmail so a pasted, padded email
  // isn't rejected outright.
  @ApiProperty({ type: String, format: 'email' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail()
  email!: string;

  @ApiProperty({ type: String })
  @IsString()
  @MinLength(1)
  password!: string;
}
