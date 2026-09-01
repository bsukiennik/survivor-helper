import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetMyBadgesUseCase } from '../../application/application/get-my-badges.use-case.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/jwt-auth.guard.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { BadgesResponseDto } from './dto/badges-response.dto.js';

/**
 * `GET /me/badges` (Story 2.4) — standalone progress view mirroring the
 * catch-count/unlock surfaced in `POST /me/applications`'s response. Same
 * guard stack as `ApplicationController`
 * (`@UseGuards(JwtAuthGuard, RolesGuard) @Roles('JobSeeker')`, Code Map) and
 * same `ApplicationModule`.
 *
 * A fresh account with 0 catches is not an error — always 200.
 */
@ApiTags('applications')
@ApiBearerAuth()
@Controller('me/badges')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('JobSeeker')
export class BadgesController {
  constructor(private readonly getMyBadges: GetMyBadgesUseCase) {}

  @Get()
  @ApiOperation({ summary: "Get the authenticated Job Seeker's catch count and Permis de Travail status" })
  @ApiOkResponse({ type: BadgesResponseDto })
  async get(@CurrentUser() user: AuthenticatedUser): Promise<BadgesResponseDto> {
    const badges = await this.getMyBadges.execute(user.id);
    return BadgesResponseDto.fromDomain(badges);
  }
}
