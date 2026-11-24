import * as argon2 from 'argon2';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../src/modules/auth/auth.service';
import { totpCode } from '../src/modules/auth/services/totp.service';
import { FieldEncryptionService } from '../src/common/crypto/field-encryption.service';
import type { UsersService } from '../src/modules/users/users.service';
import type { TokenService } from '../src/modules/auth/services/token.service';
import type { AuditService } from '../src/audit/audit.service';

const PASSWORD = 'MotDePasse123';
const SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

type StoredUser = {
  id: string;
  email: string;
  role: 'ADMIN' | 'MODELE';
  status: 'ACTIVE';
  passwordHash: string;
  emailVerifiedAt: Date | null;
  twoFactorSecretEncrypted: string | null;
  twoFactorEnabledAt: Date | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
};

async function makeUser(overrides: Partial<StoredUser> = {}): Promise<StoredUser> {
  return {
    id: 'user-1',
    email: 'admin@modelbenin.test',
    role: 'ADMIN',
    status: 'ACTIVE',
    passwordHash: await argon2.hash(PASSWORD, { type: argon2.argon2id }),
    emailVerifiedAt: new Date(),
    twoFactorSecretEncrypted: null,
    twoFactorEnabledAt: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    ...overrides,
  };
}

function buildAuth(user: StoredUser) {
  const users = {
    findByEmail: vi.fn().mockResolvedValue(user),
    findById: vi.fn().mockResolvedValue(user),
    setTwoFactorSecret: vi.fn().mockResolvedValue(undefined),
    enableTwoFactor: vi.fn().mockResolvedValue(undefined),
    recordFailedLogin: vi.fn().mockResolvedValue({ attempts: 1, lockedUntil: null }),
    clearLoginFailures: vi.fn().mockResolvedValue(undefined),
  } as unknown as UsersService & {
    setTwoFactorSecret: ReturnType<typeof vi.fn>;
    enableTwoFactor: ReturnType<typeof vi.fn>;
  };

  const tokens = {
    signTwoFactorChallenge: vi.fn().mockReturnValue('challenge-token'),
    verifyTwoFactorChallenge: vi.fn().mockReturnValue({ userId: user.id }),
    issueRefreshToken: vi.fn().mockResolvedValue('refresh-token'),
    signAccessToken: vi.fn().mockReturnValue('access-token'),
  } as unknown as TokenService;

  const audit = { log: vi.fn().mockResolvedValue(undefined) } as unknown as AuditService;

  // Chiffrement réel avec une clé fixe : on vérifie que le secret stocké n'est
  // pas en clair et qu'il reste déchiffrable.
  const encryption = new FieldEncryptionService({
    dataEncryptionKey: Buffer.alloc(32, 3).toString('base64'),
  } as never);

  const auth = new AuthService(
    users,
    tokens,
    audit,
    {} as never,
    {} as never,
    {} as never,
    encryption,
  );

  return { auth, users, tokens, audit, encryption };
}

describe('connexion administrateur avec 2FA', () => {
  it('exige l’enrôlement quand aucune 2FA n’est active', async () => {
    const user = await makeUser();
    const { auth, tokens } = buildAuth(user);

    const result = await auth.login({ email: user.email, password: PASSWORD });

    expect(result).toEqual({
      twoFactorSetupRequired: true,
      challengeToken: 'challenge-token',
    });
    expect(tokens.signTwoFactorChallenge).toHaveBeenCalledWith(user.id);
    expect(tokens.issueRefreshToken).not.toHaveBeenCalled();
  });

  it('exige un code quand la 2FA est active mais absente de la requête', async () => {
    const user = await makeUser({
      twoFactorSecretEncrypted: 'stored',
      twoFactorEnabledAt: new Date(),
    });
    const { auth, tokens } = buildAuth(user);

    const result = await auth.login({ email: user.email, password: PASSWORD });

    expect(result).toEqual({ twoFactorRequired: true, challengeToken: 'challenge-token' });
    expect(tokens.issueRefreshToken).not.toHaveBeenCalled();
  });

  it('refuse un code invalide et journalise l’échec', async () => {
    const user = await makeUser({
      twoFactorSecretEncrypted: 'stored',
      twoFactorEnabledAt: new Date(),
    });
    const { auth, audit } = buildAuth(user);

    await expect(
      auth.login({ email: user.email, password: PASSWORD, twoFactorCode: '000000' }),
    ).rejects.toThrow(/Code de vérification invalide/);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.2fa_failed', entityId: user.id }),
    );
  });

  it('ouvre une session avec un code TOTP valide', async () => {
    const user = await makeUser({
      twoFactorEnabledAt: new Date(),
    });
    const { auth, encryption, tokens } = buildAuth(user);
    user.twoFactorSecretEncrypted = encryption.encrypt(SECRET);

    const result = await auth.login({
      email: user.email,
      password: PASSWORD,
      twoFactorCode: totpCode(SECRET),
    });

    expect(result).toMatchObject({
      user: { id: user.id, role: 'ADMIN' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(tokens.issueRefreshToken).toHaveBeenCalledWith(user.id);
  });

  it('ne laisse pas un simple utilisateur contourner la 2FA', async () => {
    const user = await makeUser({ role: 'MODELE', email: 'modele@modelbenin.test' });
    const { auth } = buildAuth(user);

    const result = await auth.login({ email: user.email, password: PASSWORD });

    expect(result).toMatchObject({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });
});

describe('enrôlement 2FA', () => {
  it('stocke le secret chiffré et renvoie une URL otpauth', async () => {
    const user = await makeUser();
    const { auth, users, encryption } = buildAuth(user);

    const result = await auth.beginTwoFactorSetup({ challengeToken: 'challenge-token' });

    expect(result.otpauthUrl).toMatch(/^otpauth:\/\/totp\//);
    const stored = users.setTwoFactorSecret.mock.calls[0]?.[1] as string;
    expect(stored).not.toContain(result.secret);
    expect(encryption.decrypt(stored)).toBe(result.secret);
  });

  it('active la 2FA après un code valide et ouvre la session', async () => {
    const user = await makeUser();
    const { auth, users, encryption } = buildAuth(user);

    const { secret } = await auth.beginTwoFactorSetup({ challengeToken: 'challenge-token' });
    user.twoFactorSecretEncrypted = encryption.encrypt(secret);

    const session = await auth.enableTwoFactor({
      challengeToken: 'challenge-token',
      code: totpCode(secret),
    });

    expect(users.enableTwoFactor).toHaveBeenCalledWith(user.id);
    expect(session).toMatchObject({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });

  it('refuse un code invalide pendant l’activation', async () => {
    const user = await makeUser();
    const { auth, users, encryption } = buildAuth(user);

    const { secret } = await auth.beginTwoFactorSetup({ challengeToken: 'challenge-token' });
    user.twoFactorSecretEncrypted = encryption.encrypt(secret);

    await expect(
      auth.enableTwoFactor({ challengeToken: 'challenge-token', code: '123456' }),
    ).rejects.toThrow(/Code de vérification invalide/);
    expect(users.enableTwoFactor).not.toHaveBeenCalled();
  });

  it('refuse un jeton de défi invalide', async () => {
    const user = await makeUser();
    const { auth, tokens } = buildAuth(user);
    (tokens.verifyTwoFactorChallenge as ReturnType<typeof vi.fn>).mockReturnValue(null);

    await expect(auth.beginTwoFactorSetup({ challengeToken: 'nope' })).rejects.toThrow(
      /invalide ou expiré/,
    );
  });
});
