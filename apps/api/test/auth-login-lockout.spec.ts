import * as argon2 from 'argon2';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../src/modules/auth/auth.service';
import {
  BASE_LOCK_MS,
  LOCKOUT_THRESHOLD,
  MAX_LOCK_MS,
  loginLockDelayMs,
} from '../src/modules/auth/services/login-lockout';

describe('loginLockDelayMs', () => {
  it('ne bloque pas les premiers essais', () => {
    for (let attempts = 0; attempts < LOCKOUT_THRESHOLD; attempts += 1) {
      expect(loginLockDelayMs(attempts)).toBe(0);
    }
  });

  it('augmente progressivement puis plafonne à 24 h', () => {
    expect(loginLockDelayMs(5)).toBe(BASE_LOCK_MS);
    expect(loginLockDelayMs(6)).toBe(BASE_LOCK_MS * 4);
    expect(loginLockDelayMs(7)).toBe(BASE_LOCK_MS * 16);
    expect(loginLockDelayMs(50)).toBe(MAX_LOCK_MS);
  });
});

const PASSWORD = 'MotDePasse123';

async function buildAuth(overrides: Record<string, unknown> = {}) {
  const user = {
    id: 'user-1',
    email: 'modele@modelbenin.test',
    role: 'MODELE',
    status: 'ACTIVE',
    passwordHash: await argon2.hash(PASSWORD, { type: argon2.argon2id }),
    emailVerifiedAt: new Date(),
    twoFactorSecretEncrypted: null,
    twoFactorEnabledAt: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    ...overrides,
  };

  const users = {
    findByEmail: vi.fn().mockResolvedValue(user),
    findById: vi.fn().mockResolvedValue(user),
    recordFailedLogin: vi.fn().mockResolvedValue({ attempts: 5, lockedUntil: new Date() }),
    clearLoginFailures: vi.fn().mockResolvedValue(undefined),
  };
  const tokens = {
    issueRefreshToken: vi.fn().mockResolvedValue('refresh-token'),
    signAccessToken: vi.fn().mockReturnValue('access-token'),
  };
  const audit = { log: vi.fn().mockResolvedValue(undefined) };

  const auth = new AuthService(
    users as never,
    tokens as never,
    audit as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

  return { auth, users, tokens, audit, user };
}

describe('verrouillage progressif à la connexion', () => {
  it('refuse un compte verrouillé avec un message neutre et journalise', async () => {
    const { auth, users, audit } = await buildAuth({
      lockedUntil: new Date(Date.now() + 60_000),
    });

    await expect(
      auth.login({ email: 'modele@modelbenin.test', password: PASSWORD }),
    ).rejects.toThrow('Identifiants incorrects.');
    expect(users.recordFailedLogin).not.toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.login_locked' }),
    );
  });

  it('accepte un compte dont le verrouillage est expiré', async () => {
    const { auth, users } = await buildAuth({ lockedUntil: new Date(Date.now() - 1_000) });

    const session = await auth.login({ email: 'modele@modelbenin.test', password: PASSWORD });

    expect(session).toMatchObject({ accessToken: 'access-token' });
    expect(users.clearLoginFailures).toHaveBeenCalledWith('user-1');
  });

  it('incrémente le compteur et journalise un mauvais mot de passe', async () => {
    const { auth, users, audit } = await buildAuth();

    await expect(
      auth.login({ email: 'modele@modelbenin.test', password: 'MauvaisMotDePasse1' }),
    ).rejects.toThrow('Identifiants incorrects.');
    expect(users.recordFailedLogin).toHaveBeenCalledWith('user-1');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.login_failed' }),
    );
  });

  it('remet le compteur à zéro après une connexion réussie', async () => {
    const { auth, users } = await buildAuth({ failedLoginAttempts: 3 });

    await auth.login({ email: 'modele@modelbenin.test', password: PASSWORD });

    expect(users.clearLoginFailures).toHaveBeenCalledWith('user-1');
  });
});
