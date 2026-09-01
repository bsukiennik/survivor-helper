import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { RolesGuard } from './roles.guard.js';

const DEV_ONLY_DEFAULT_SECRET = 'dev-only-insecure-secret-change-me';

// Fails fast at boot rather than silently signing production tokens with
// the checked-into-source-control default — the .env.example warning alone
// doesn't stop a misconfigured deploy from starting up "successfully".
function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production' && (!secret || secret === DEV_ONLY_DEFAULT_SECRET)) {
    throw new Error(
      'JWT_SECRET must be set to a real value in production (refusing the dev-only default).',
    );
  }
  return secret || DEV_ONLY_DEFAULT_SECRET;
}

const jwtModule = JwtModule.register({
  secret: resolveJwtSecret(),
  signOptions: { expiresIn: '1d' },
});

/**
 * Just the JWT machinery + guards (AD-4, AD-15), split out from `AuthModule`
 * so a module that only needs `@UseGuards(JwtAuthGuard)` — `ProfileModule`,
 * and every future protected route — doesn't have to import the whole auth
 * surface (`AuthController`, `RegisterAccountUseCase`, `LoginUseCase`, the
 * account repository/password hasher) just to resolve a guard.
 *
 * `jwtModule` is exported alongside the guards — a guard referenced by
 * class in another module's `@UseGuards()` is instantiated in *that*
 * module's DI context, so `JwtService` (`JwtAuthGuard`'s own dependency)
 * must be resolvable there too, not just inside this module.
 */
@Module({
  imports: [jwtModule],
  providers: [RolesGuard, JwtAuthGuard],
  exports: [RolesGuard, JwtAuthGuard, jwtModule],
})
export class AuthGuardsModule {}
