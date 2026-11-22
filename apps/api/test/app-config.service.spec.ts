import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AppConfigService } from '../src/config/app-config.service';

const MANAGED_VARS = [
  'BILLING_MODE',
  'BILLING_PROVIDER',
  'BILLING_SIMULATION',
  'NODE_ENV',
] as const;

const saved = new Map<string, string | undefined>();

beforeEach(() => {
  for (const key of MANAGED_VARS) {
    saved.set(key, process.env[key]);
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of MANAGED_VARS) {
    const value = saved.get(key);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  saved.clear();
});

describe('AppConfigService.billingMode', () => {
  it('accepte les trois modes explicites, sauf live avant les entitlements', () => {
    const config = new AppConfigService();

    process.env.BILLING_MODE = 'disabled';
    expect(config.billingMode).toBe('disabled');

    process.env.BILLING_MODE = 'simulation';
    expect(config.billingMode).toBe('simulation');

    process.env.BILLING_MODE = 'live';
    expect(() => config.billingMode).toThrow(/lot 3/);
  });

  it('refuse une valeur inconnue', () => {
    const config = new AppConfigService();
    process.env.BILLING_MODE = 'sandbox';
    expect(() => config.billingMode).toThrow(/disabled, simulation ou live/);
  });

  it('désactive les paiements par défaut en production', () => {
    const config = new AppConfigService();
    process.env.NODE_ENV = 'production';
    expect(config.billingMode).toBe('disabled');
  });

  it('simule les paiements par défaut hors production', () => {
    const config = new AppConfigService();
    process.env.NODE_ENV = 'development';
    expect(config.billingMode).toBe('simulation');
  });

  it('respecte les anciennes variables sans jamais activer le réel', () => {
    const config = new AppConfigService();

    process.env.BILLING_SIMULATION = 'false';
    expect(config.billingMode).toBe('disabled');

    delete process.env.BILLING_SIMULATION;
    process.env.BILLING_PROVIDER = 'FEDAPAY';
    expect(() => config.billingMode).toThrow(/BILLING_MODE/);
  });

  it('échoue au démarrage si le mode est invalide', () => {
    const config = new AppConfigService();
    process.env.BILLING_MODE = 'live';
    expect(() => config.onModuleInit()).toThrow(/lot 3/);
  });
});
