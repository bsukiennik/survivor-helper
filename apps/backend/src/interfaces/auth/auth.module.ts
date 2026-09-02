import { Module } from '@nestjs/common';
import { LoginUseCase } from '../../application/account/login.use-case.js';
import { RegisterAccountUseCase } from '../../application/account/register-account.use-case.js';
import { ACCOUNT_REPOSITORY_PORT } from '../../application/ports/account-repository.port.js';
import { EMPLOYER_PROFILE_REPOSITORY_PORT } from '../../application/ports/employer-profile-repository.port.js';
import { PASSWORD_HASHER_PORT } from '../../application/ports/password-hasher.port.js';
import { TOKEN_ISSUER_PORT } from '../../application/ports/token-issuer.port.js';
import { BcryptPasswordHasherAdapter } from '../../infrastructure/auth/bcrypt-password-hasher.adapter.js';
import { JwtTokenIssuerAdapter } from '../../infrastructure/auth/jwt-token-issuer.adapter.js';
import { DrizzleAccountRepository } from '../../infrastructure/persistence/drizzle/account.repository.js';
import { DrizzleEmployerProfileRepository } from '../../infrastructure/persistence/drizzle/employer-profile.repository.js';
import { AuthController } from './auth.controller.js';
import { AuthGuardsModule } from './auth-guards.module.js';

// No ConfigModule here (see app.module.ts's comment) — JWT_SECRET is read
// directly from process.env, same pattern as every other consumer.
//
// The JWT/guards machinery lives in AuthGuardsModule (not here) so a module
// that only needs `@UseGuards(JwtAuthGuard)` — ProfileModule and every
// future protected route — doesn't have to import this whole auth surface
// (AuthController, the use cases, the account repository/password hasher)
// just to resolve a guard. AuthModule imports AuthGuardsModule right back,
// though: JwtTokenIssuerAdapter (used by RegisterAccountUseCase/LoginUseCase
// to *sign* tokens) depends on the same JwtService the guards use to
// *verify* them — one JwtModule registration, shared both ways.
@Module({
  imports: [AuthGuardsModule],
  controllers: [AuthController],
  providers: [
    RegisterAccountUseCase,
    LoginUseCase,
    { provide: ACCOUNT_REPOSITORY_PORT, useClass: DrizzleAccountRepository },
    { provide: PASSWORD_HASHER_PORT, useClass: BcryptPasswordHasherAdapter },
    { provide: TOKEN_ISSUER_PORT, useClass: JwtTokenIssuerAdapter },
    // Bound independently here (not imported from a shared EmployerModule) —
    // mirrors how LISTING_REPOSITORY_PORT is bound independently in both
    // ListingsModule and ApplicationModule (Code Map). RegisterAccountUseCase
    // (the writer) needs it here; EmployerModule (the reader, GET
    // /me/employer-profile) binds its own copy separately.
    { provide: EMPLOYER_PROFILE_REPOSITORY_PORT, useClass: DrizzleEmployerProfileRepository },
  ],
})
export class AuthModule {}
