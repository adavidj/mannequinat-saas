import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import Redis from 'ioredis';

import { AppConfigService } from '../config/app-config.service';
import { ConfigModule } from '../config/config.module';
import { REDIS_CLIENT, RedisThrottlerStorageService } from './redis-throttler.storage';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [AppConfigService, RedisThrottlerStorageService],
      useFactory: (config: AppConfigService, storage: RedisThrottlerStorageService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: 60_000,
            limit: 30,
            blockDuration: 60_000,
          },
          {
            name: 'medium',
            ttl: 300_000,
            limit: 100,
            blockDuration: 300_000,
          },
        ],
        storage,
      }),
    }),
  ],
  providers: [
    RedisThrottlerStorageService,
    {
      provide: REDIS_CLIENT,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) =>
        new Redis(config.redisUrl, { maxRetriesPerRequest: 1, enableOfflineQueue: false }),
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [ThrottlerModule],
})
export class RateLimitModule {}
