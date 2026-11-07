import { BadRequestException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../src/modules/auth/auth.service';

const GENERIC_MESSAGE =
  'Si un compte existe avec cette adresse, un e-mail de réinitialisation vient d’être envoyé.';

function buildUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'awa@example.com',
    passwordHash: 'hashed',
    role: UserRole.MODELE,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: new Date('2026-11-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createService() {
  const users = {
    findByEmail: vi.fn().mockResolvedValue(buildUser()),
    findById: vi.fn().mockResolvedValue(buildUser()),
    updatePassword: vi.fn().mockResolvedValue(buildUser()),
  };
  const tokens = {
    issuePasswordReset: vi.fn().mockResolvedValue('reset-token'),
    consumePasswordResetToken: vi.fn().mockResolvedValue({ userId: 'user-1' }),
    revokeAllForUser: vi.fn().mockResolvedValue(undefined),
  };
  const audit = { log: vi.fn().mockResolvedValue(undefined) };
  const notifications = { notify: vi.fn().mockResolvedValue(undefined) };
  const mail = { send: vi.fn().mockResolvedValue(undefined) };
  const config = {
    appPublicUrl: 'https://modelbenin.test',
    passwordResetTtlMinutes: 30,
    emailVerificationTtlMinutes: 60,
  };

  return {
    service: new AuthService(
      users as never,
      tokens as never,
      audit as never,
      notifications as never,
      mail as never,
      config as never,
    ),
    users,
    tokens,
    audit,
    mail,
  };
}

describe('AuthService password reset', () => {
  it('sends a single-use reset link to an existing account', async () => {
    const { service, tokens, mail } = createService();

    const result = await service.forgotPassword({ email: 'Awa@Example.com' });

    expect(result.message).toBe(GENERIC_MESSAGE);
    expect(tokens.issuePasswordReset).toHaveBeenCalledWith('user-1');
    expect(mail.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'awa@example.com',
        text: expect.stringContaining(
          'https://modelbenin.test/reinitialiser-mot-de-passe?token=reset-token',
        ),
      }),
    );
  });

  it('keeps the same answer for an unknown address and sends nothing', async () => {
    const { service, users, tokens, mail } = createService();
    users.findByEmail.mockResolvedValue(null);

    const result = await service.forgotPassword({ email: 'inconnu@example.com' });

    expect(result.message).toBe(GENERIC_MESSAGE);
    expect(tokens.issuePasswordReset).not.toHaveBeenCalled();
    expect(mail.send).not.toHaveBeenCalled();
  });

  it('does not send a reset link for a suspended account', async () => {
    const { service, users, tokens, mail } = createService();
    users.findByEmail.mockResolvedValue(buildUser({ status: UserStatus.SUSPENDED }));

    const result = await service.forgotPassword({ email: 'awa@example.com' });

    expect(result.message).toBe(GENERIC_MESSAGE);
    expect(tokens.issuePasswordReset).not.toHaveBeenCalled();
    expect(mail.send).not.toHaveBeenCalled();
  });

  it('rejects an invalid or expired reset token', async () => {
    const { service, tokens, users } = createService();
    tokens.consumePasswordResetToken.mockResolvedValue(null);

    await expect(
      service.resetPassword({ token: 'expired', password: 'NouveauMotDePasse1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(users.updatePassword).not.toHaveBeenCalled();
  });

  it('stores the new hash, revokes sessions and audits the change', async () => {
    const { service, users, tokens, audit, mail } = createService();

    const result = await service.resetPassword({
      token: 'reset-token',
      password: 'NouveauMotDePasse1',
    });

    expect(result.message).toContain('Mot de passe réinitialisé');
    expect(users.updatePassword).toHaveBeenCalledWith('user-1', expect.any(String));
    const [, passwordHash] = users.updatePassword.mock.calls[0] as [string, string];
    await expect(argon2.verify(passwordHash, 'NouveauMotDePasse1')).resolves.toBe(true);
    expect(tokens.revokeAllForUser).toHaveBeenCalledWith('user-1');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'user-1',
        action: 'auth.password_reset',
        entityType: 'user',
      }),
    );
    expect(mail.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'awa@example.com' }));
  });
});
