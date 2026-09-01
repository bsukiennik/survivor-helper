import { JwtService } from '@nestjs/jwt';
import { describe, expect, it } from 'vitest';
import { JwtTokenIssuerAdapter } from './jwt-token-issuer.adapter.js';

describe('JwtTokenIssuerAdapter', () => {
  it('issues a token whose payload sub claim is the account id', async () => {
    const jwtService = new JwtService({ secret: 'test-secret' });
    const adapter = new JwtTokenIssuerAdapter(jwtService);

    const token = await adapter.issue({ id: 'account-1', role: 'JobSeeker' });
    const payload = jwtService.verify(token);

    expect(payload.sub).toBe('account-1');
    expect(payload.role).toBe('JobSeeker');
  });
});
