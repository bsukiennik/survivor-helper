import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import type { PasswordHasherPort } from '../../application/ports/password-hasher.port.js';

const SALT_ROUNDS = 10;

@Injectable()
export class BcryptPasswordHasherAdapter implements PasswordHasherPort {
  async hash(plainTextPassword: string): Promise<string> {
    return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
  }

  async compare(plainTextPassword: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, passwordHash);
  }
}
