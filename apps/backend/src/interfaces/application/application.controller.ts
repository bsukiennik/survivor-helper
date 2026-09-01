import { Body, Controller, NotFoundException, Post, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ApplyToListingUseCase } from '../../application/application/apply-to-listing.use-case.js';
import { ListingNotFoundError } from '../../domain/listing/listing-not-found.error.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/jwt-auth.guard.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ApplicationResponseDto } from './dto/application-response.dto.js';
import { CatchDto } from './dto/catch.dto.js';

/**
 * `POST /me/applications` — first live route stacking both guards
 * (`@UseGuards(JwtAuthGuard, RolesGuard) @Roles('JobSeeker')`, Code Map):
 * `JwtAuthGuard` verifies the bearer token and sets `request.user`, then
 * `RolesGuard` denies anything but a `JobSeeker` token with 403. Both the
 * plain "Postuler" affordance and the visually distinct "Catch" affordance
 * in `MapView.tsx` call this same endpoint.
 */
@ApiTags('applications')
@ApiBearerAuth()
@Controller('me/applications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('JobSeeker')
export class ApplicationController {
  constructor(private readonly applyToListing: ApplyToListingUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Catch/apply to a Listing as the authenticated Job Seeker' })
  @ApiCreatedResponse({ type: ApplicationResponseDto })
  @ApiOkResponse({ type: ApplicationResponseDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse()
  async apply(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CatchDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApplicationResponseDto> {
    try {
      const application = await this.applyToListing.execute({
        jobSeekerId: user.id,
        listingId: dto.listingId,
      });

      // First catch is 201 (created); a repeat catch is a silent 200
      // no-op, never an error (I/O matrix).
      res.status(application ? 201 : 200);
      return ApplicationResponseDto.fromResult(application, dto.listingId);
    } catch (error) {
      if (error instanceof ListingNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
