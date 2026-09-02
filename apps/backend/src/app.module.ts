import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulingModule } from './infrastructure/scheduling/scheduling.module.js';
import { ApplicationModule } from './interfaces/application/application.module.js';
import { AuthModule } from './interfaces/auth/auth.module.js';
import { EmployerModule } from './interfaces/employer/employer.module.js';
import { EmployerListingsModule } from './interfaces/listings/employer-listings.module.js';
import { ListingsModule } from './interfaces/listings/listings.module.js';
import { ProfileModule } from './interfaces/profile/profile.module.js';
import { TilesModule } from './interfaces/tiles/tiles.module.js';

// No ConfigModule/ConfigService here on purpose: the standalone Drizzle
// scripts (migrate.ts, seed.ts, drizzle.config.ts) run outside Nest's IoC
// container entirely and read `process.env` directly (via `dotenv/config`),
// so a ConfigService wired only inside the Nest app would still leave two
// coexisting env-access patterns. Every consumer — in-app or standalone —
// reads `process.env` directly and consistently instead.
// `ScheduleModule.forRoot()` (Story 3.2) — this codebase's first
// `@nestjs/schedule` job — stays at the root, same as any other Nest
// framework module. Its `ListingArchivalScheduler` and the use
// case/port binding it needs live in `SchedulingModule`, same "thin
// feature module" shape as every other cross-cutting concern here.
@Module({
  imports: [
    ScheduleModule.forRoot(),
    ListingsModule,
    TilesModule,
    AuthModule,
    ProfileModule,
    ApplicationModule,
    EmployerModule,
    EmployerListingsModule,
    SchedulingModule,
  ],
})
export class AppModule {}
