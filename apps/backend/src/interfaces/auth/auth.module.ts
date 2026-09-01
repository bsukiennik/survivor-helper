import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LoginUseCase } from '../../application/account/login.use-case.js';
import { RegisterAccountUseCase } from '../../application/account/register-account.use-case.js';
import { ACCOUNT_REPOSITORY_PORT } from '../../application/ports/account-repository.port.js';
import { PASSWORD_HASHER_PORT } from '../../application/ports/password-hasher.port.js';
import { TOKEN_ISSUER_PORT } from '../../application/ports/token-issuer.port.js';
import { BcryptPasswordHasherAdapter } from '../../infrastructure/auth/bcrypt-password-hasher.adapter.js';
import { JwtTokenIssuerAdapter } from '../../infrastructure/auth/jwt-token-issuer.adapter.js';
import { DrizzleAccountRepository } from '../../infrastructure/persistence/drizzle/account.repository.js';
import { AuthController } from './auth.controller.js';
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

// No ConfigModule here (see app.module.ts's comment) — JWT_SECRET is read
// directly from process.env, same pattern as every other consumer.
@Module({
  imports: [
    JwtModule.register({
      secret: resolveJwtSecret(),
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    RegisterAccountUseCase,
    LoginUseCase,
    RolesGuard,
    { provide: ACCOUNT_REPOSITORY_PORT, useClass: DrizzleAccountRepository },
    { provide: PASSWORD_HASHER_PORT, useClass: BcryptPasswordHasherAdapter },
    { provide: TOKEN_ISSUER_PORT, useClass: JwtTokenIssuerAdapter },
  ],
  // RolesGuard exported (AD-15) so a later Employer/Admin route module can
  // `@UseGuards(RolesGuard)` without redefining it.
  exports: [RolesGuard],
})
export class AuthModule {}
