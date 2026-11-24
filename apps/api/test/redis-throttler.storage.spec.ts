import { describe, expect, it, vi } from 'vitest';

import { RedisThrottlerStorageService } from '../src/rate-limit/redis-throttler.storage';

/**
 * Implémentation mémoire du contrat du script Lua : compteur à fenêtre fixe,
 * clé de blocage séparée, horloge contrôlable. Elle permet de tester le
 * stockage sans Redis réel tout en vérifiant les valeurs renvoyées.
 */
class FakeRedis {
  clock = Date.now();
  private counters = new Map<string, { value: number; expiresAt: number }>();
  private blocks = new Map<string, number>();
  evalCalls = 0;
  otherCommands = 0;

  async eval(
    _script: string,
    _numKeys: number,
    counterKey: string,
    blockKey: string,
    ttl: number,
    limit: number,
    blockDuration: number,
  ): Promise<[number, number, number, number]> {
    this.evalCalls += 1;
    const now = this.clock;

    const blockUntil = this.blocks.get(blockKey);
    if (blockUntil && blockUntil > now) {
      const seconds = Math.ceil((blockUntil - now) / 1000);
      return [this.counters.get(counterKey)?.value ?? 0, seconds, 1, seconds];
    }

    const entry = this.counters.get(counterKey);
    if (!entry || entry.expiresAt <= now) {
      this.counters.set(counterKey, { value: 1, expiresAt: now + ttl });
    } else {
      entry.value += 1;
    }
    const current = this.counters.get(counterKey)!;
    const timeToExpire = Math.ceil((current.expiresAt - now) / 1000);

    if (current.value > limit && blockDuration > 0) {
      this.counters.delete(counterKey);
      this.blocks.set(blockKey, now + blockDuration);
      return [current.value, timeToExpire, 1, Math.ceil(blockDuration / 1000)];
    }

    return [current.value, timeToExpire, 0, 0];
  }

  disconnect(): void {
    this.otherCommands += 1;
  }
}

function build(client: FakeRedis | { eval: () => Promise<never> }) {
  return new RedisThrottlerStorageService({ redisUrl: 'redis://localhost:6379' } as never, client as never);
}

describe('RedisThrottlerStorageService', () => {
  it('bloque au-delà de la limite et expire après la durée de blocage', async () => {
    const redis = new FakeRedis();
    const storage = build(redis);

    const first = await storage.increment('ip', 60_000, 2, 10_000, 'short');
    const second = await storage.increment('ip', 60_000, 2, 10_000, 'short');
    const third = await storage.increment('ip', 60_000, 2, 10_000, 'short');

    expect(first).toMatchObject({ totalHits: 1, isBlocked: false });
    expect(second).toMatchObject({ totalHits: 2, isBlocked: false });
    expect(third.isBlocked).toBe(true);
    expect(third.timeToBlockExpire).toBe(10);

    const duringBlock = await storage.increment('ip', 60_000, 2, 10_000, 'short');
    expect(duringBlock.isBlocked).toBe(true);

    redis.clock += 10_001;
    const afterBlock = await storage.increment('ip', 60_000, 2, 10_000, 'short');
    expect(afterBlock.isBlocked).toBe(false);
    expect(afterBlock.totalHits).toBe(1);
  });

  it('exprime les durées en secondes, pas en millisecondes', async () => {
    const redis = new FakeRedis();
    const storage = build(redis);

    const result = await storage.increment('ip', 60_000, 10, 0, 'short');

    expect(result.timeToExpire).toBe(60);
    expect(result.timeToBlockExpire).toBe(0);
  });

  it('met à jour compteur et blocage en un seul appel atomique', async () => {
    const redis = new FakeRedis();
    const storage = build(redis);

    await storage.increment('ip', 60_000, 1, 60_000, 'short');
    await storage.increment('ip', 60_000, 1, 60_000, 'short');

    expect(redis.evalCalls).toBe(2);
    expect(redis.otherCommands).toBe(0);
  });

  it('bascule sur le stockage mémoire si Redis échoue', async () => {
    const failing = { eval: vi.fn().mockRejectedValue(new Error('connexion refusée')) };
    const storage = build(failing);

    const first = await storage.increment('ip', 60_000, 1, 60_000, 'short');
    const second = await storage.increment('ip', 60_000, 1, 60_000, 'short');

    expect(first.isBlocked).toBe(false);
    expect(second.isBlocked).toBe(true);
  });
});
