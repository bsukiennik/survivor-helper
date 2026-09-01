import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetMyProfileUseCase } from '../../application/profile/get-my-profile.use-case.js';
import { SaveMyProfileUseCase } from '../../application/profile/save-my-profile.use-case.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/jwt-auth.guard.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ProfileResponseDto } from './dto/profile-response.dto.js';
import { SaveProfileDto } from './dto/save-profile.dto.js';

/**
 * `GET/PUT /me/profile` — gated by `JwtAuthGuard` only (any authenticated
 * account manages *their own* profile row, keyed by `request.user.id`; no
 * `RolesGuard`/`@Roles()` here — Employer/Admin "profile" isn't defined
 * until Epic 3/5, and nothing in this story's scope stops them from calling
 * this today).
 */
@ApiTags('profile')
@ApiBearerAuth()
@Controller('me/profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly getMyProfile: GetMyProfileUseCase,
    private readonly saveMyProfile: SaveMyProfileUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get the authenticated account's Job Seeker profile" })
  @ApiOkResponse({ type: ProfileResponseDto })
  async get(@CurrentUser() user: AuthenticatedUser): Promise<ProfileResponseDto> {
    const profile = await this.getMyProfile.execute(user.id);
    return ProfileResponseDto.fromDomain(profile);
  }

  @Put()
  @ApiOperation({ summary: "Create/update the authenticated account's Job Seeker profile" })
  @ApiOkResponse({ type: ProfileResponseDto })
  async save(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SaveProfileDto,
  ): Promise<ProfileResponseDto> {
    const profile = await this.saveMyProfile.execute({
      accountId: user.id,
      skills: dto.skills,
      experience: dto.experience,
      availability: dto.availability,
    });
    return ProfileResponseDto.fromDomain(profile);
  }
}
