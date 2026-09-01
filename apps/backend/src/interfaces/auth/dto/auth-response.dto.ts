import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for both `POST /auth/register` and `POST /auth/login`
 * (AD-10 — OpenAPI generated from these decorators, never hand-authored).
 */
export class AuthResponseDto {
  @ApiProperty({ type: String })
  accessToken!: string;

  static fromAccessToken(accessToken: string): AuthResponseDto {
    const dto = new AuthResponseDto();
    dto.accessToken = accessToken;
    return dto;
  }
}
