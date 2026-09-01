import { describe, expect, it } from 'vitest';
import { BcryptPasswordHasherAdapter } from './bcrypt-password-hasher.adapter.js';

describe('BcryptPasswordHasherAdapter', () => {
  it('produces a hash that is not the plaintext password', async () => {
    const adapter = new BcryptPasswordHasherAdapter();

    const hash = await adapter.hash('correcthorse');

    expect(hash).not.toBe('correcthorse');
  });

  it('confirms a matching password against its own hash', async () => {
    const adapter = new BcryptPasswordHasherAdapter();
    const hash = await adapter.hash('correcthorse');

    await expect(adapter.compare('correcthorse', hash)).resolves.toBe(true);
  });

  it('rejects a non-matching password against a hash', async () => {
    const adapter = new BcryptPasswordHasherAdapter();
    const hash = await adapter.hash('correcthorse');

    await expect(adapter.compare('wrong-password', hash)).resolves.toBe(false);
  });
});
