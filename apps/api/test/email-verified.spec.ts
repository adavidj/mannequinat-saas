import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';

import { EmailVerifiedGuard } from '../src/common/guards/email-verified.guard';
import { AccountController } from '../src/modules/account/account.controller';
import { BillingController } from '../src/modules/billing/billing.controller';

function contextFor(
  controller: abstract new (...args: never[]) => object,
  handler: () => unknown,
  user: unknown,
): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('@EmailVerifiedRequired', () => {
  const guard = new EmailVerifiedGuard(new Reflector());

  it('protège toutes les routes de compte et de facturation', () => {
    const unverified = { id: 'user-1', emailVerifiedAt: null };

    expect(() =>
      guard.canActivate(contextFor(AccountController, AccountController.prototype.export, unverified)),
    ).toThrow(/Vérification de l'e-mail requise/);
    expect(() =>
      guard.canActivate(
        contextFor(BillingController, BillingController.prototype.checkout, unverified),
      ),
    ).toThrow(/Vérification de l'e-mail requise/);
  });

  it('laisse passer un compte dont l’e-mail est vérifié', () => {
    const verified = { id: 'user-1', emailVerifiedAt: new Date() };

    expect(
      guard.canActivate(contextFor(AccountController, AccountController.prototype.export, verified)),
    ).toBe(true);
    expect(
      guard.canActivate(
        contextFor(BillingController, BillingController.prototype.checkout, verified),
      ),
    ).toBe(true);
  });
});
