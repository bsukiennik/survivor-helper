import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginUseCase } from '../../application/account/login.use-case.js';
import { RegisterAccountUseCase } from '../../application/account/register-account.use-case.js';
import { EmailAlreadyRegisteredError } from '../../domain/account/email-already-registered.error.js';
import { InvalidCredentialsError } from '../../domain/account/invalid-credentials.error.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { RegisterEmployerDto } from './dto/register-employer.dto.js';

/**
 * `POST /auth/register`, `POST /auth/register/employer` and
 * `POST /auth/login` — no guard on any of them (a visitor isn't
 * authenticated yet by definition). All registration routes call the shared
 * provisioning path (AD-13) via `RegisterAccountUseCase`; `register` always
 * passes `role = 'JobSeeker'` with no `employerProfile`, `registerEmployer`
 * always passes `role = 'Employer'` plus `employerProfile: { companyName }`.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerAccount: RegisterAccountUseCase,
    private readonly login: LoginUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new Job Seeker account' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    try {
      const result = await this.registerAccount.execute({
        email: dto.email,
        password: dto.password,
        role: 'JobSeeker',
      });
      return AuthResponseDto.fromAccessToken(result.accessToken);
    } catch (error) {
      if (error instanceof EmailAlreadyRegisteredError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  @Post('register/employer')
  @ApiOperation({ summary: 'Register a new Employer account (verification starts pending)' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  async registerEmployer(@Body() dto: RegisterEmployerDto): Promise<AuthResponseDto> {
    try {
      const result = await this.registerAccount.execute({
        email: dto.email,
        password: dto.password,
        role: 'Employer',
        employerProfile: { companyName: dto.companyName },
      });
      return AuthResponseDto.fromAccessToken(result.accessToken);
    } catch (error) {
      if (error instanceof EmailAlreadyRegisteredError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Log in with an existing account' })
  @ApiOkResponse({ type: AuthResponseDto })
  async loginRoute(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    try {
      const result = await this.login.execute({ email: dto.email, password: dto.password });
      return AuthResponseDto.fromAccessToken(result.accessToken);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
  }
}
