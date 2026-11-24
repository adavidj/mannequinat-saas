import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageService } from '@nestjs/throttler';
import Redis from 'ioredis';

import { AppConfigService } from '../config/app-config.service';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

type ThrottlerStorageRecord = {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
};

/**
 * Incrémente un compteur et applique un blocage, en une seule opération.
 *
 * Le script Lua s'exécute atomiquement côté Redis : deux requêtes parallèles ne
 * peuvent pas lire le même compteur puis l'incrémenter deux fois. La clé de
 * blocage a sa propre durée de vie, indépendante de la fenêtre de comptage.
 */
export const INCREMENT_SCRIPT = `
local counterKey = KEYS[1]
local blockKey = KEYS[2]
local ttl = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local blockDuration = tonumber(ARGV[3])

local blockPttl = redis.call('PTTL', blockKey)
if blockPttl and blockPttl > 0 then
  local total = tonumber(redis.call('GET', counterKey) or '0')
  local seconds = math.ceil(blockPttl / 1000)
  return { total, seconds, 1, seconds }
end

local total = redis.call('INCR', counterKey)
if total == 1 then
  redis.call('PEXPIRE', counterKey, ttl)
end

local counterPttl = redis.call('PTTL', counterKey)
if counterPttl < 0 then
  counterPttl = ttl
end
local timeToExpire = math.ceil(counterPttl / 1000)

if total > limit and blockDuration > 0 then
  -- Repartir d'un compteur vierge après le blocage, sinon la première
  -- requête suivante dépasserait encore le plafond et relancerait un blocage.
  redis.call('DEL', counterKey)
  redis.call('SET', blockKey, '1', 'PX', blockDuration)
  return { total, timeToExpire, 1, math.ceil(blockDuration / 1000) }
end

return { total, timeToExpire, 0, 0 }
`;

@Injectable()
export class RedisThrottlerStorageService implements ThrottlerStorage {
  private readonly logger = new Logger(RedisThrottlerStorageService.name);
  private readonly redis: Redis;
  /** Repli mémoire si Redis est indisponible : on ne laisse pas passer tout le trafic. */
  private readonly fallback = new ThrottlerStorageService();
  private warned = false;
  private connectionWarned = false;

  constructor(
    config: AppConfigService,
    @Optional() @Inject(REDIS_CLIENT) client?: Redis,
  ) {
    this.redis =
      client ??
      new Redis(config.redisUrl, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });
    // Sans écouteur, un événement `error` d'ioredis ferait planter le processus
    // au lieu de déclencher le repli mémoire.
    this.redis.on?.('error', (error: Error) => {
      if (!this.connectionWarned) {
        this.connectionWarned = true;
        this.logger.warn(`Connexion Redis impossible : ${error.message}`);
      }
    });
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    try {
      const result = (await this.redis.eval(
        INCREMENT_SCRIPT,
        2,
        `throttle:${throttlerName}:${key}`,
        `throttle:block:${throttlerName}:${key}`,
        ttl,
        limit,
        blockDuration,
      )) as [number | string, number | string, number | string, number | string];

      return {
        totalHits: Number(result[0] ?? 0),
        timeToExpire: Number(result[1] ?? 0),
        isBlocked: Number(result[2] ?? 0) === 1,
        timeToBlockExpire: Number(result[3] ?? 0),
      };
    } catch (error: unknown) {
      if (!this.warned) {
        this.warned = true;
        this.logger.warn(
          `Redis indisponible pour le rate limiting, repli mémoire : ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
      return this.fallback.increment(key, ttl, limit, blockDuration, throttlerName);
    }
  }

  onApplicationShutdown(): void {
    this.fallback.onApplicationShutdown();
    this.redis.disconnect();
  }
}
