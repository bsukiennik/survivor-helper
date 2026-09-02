import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetMyEmployerProfileUseCase } from '../../application/employer/get-my-employer-profile.use-case.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/jwt-auth.guard.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { EmployerProfileResponseDto } from './dto/employer-profile-response.dto.js';

/**
 * `GET /me/employer-profile` (Story 3.1) — lets an Employer check their own
 * verification status without waiting on the (not-yet-built, Epic 5) admin
 * tooling. Same guard stack as `BadgesController`
 * (`@UseGuards(JwtAuthGuard, RolesGuard) @Roles(...)`, Code Map) restricted
 * to `'Employer'` instead of `'JobSeeker'`.
 */
@ApiTags('employer')
@ApiBearerAuth()
@Controller('me/employer-profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Employer')
export class EmployerProfileController {
  constructor(private readonly getMyEmployerProfile: GetMyEmployerProfileUseCase) {}

  @Get()
  @ApiOperation({ summary: "Get the authenticated Employer's company name and verification status" })
  @ApiOkResponse({ type: EmployerProfileResponseDto })
  async get(@CurrentUser() user: AuthenticatedUser): Promise<EmployerProfileResponseDto> {
    const profile = await this.getMyEmployerProfile.execute(user.id);
    if (!profile) {
      // Should not happen: an Employer account always gets its
      // employer_profiles row created atomically at registration. Surfaced
      // as 404 rather than a fabricated/empty response if that invariant is
      // ever broken out-of-band.
      throw new NotFoundException('Employer profile not found');
    }
    return EmployerProfileResponseDto.fromDomain(profile);
  }
}
