import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RedisThrottlerStorageService } from './redis-throttler.storage';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'short',
          ttl: 60_000,
          limit: 30,
        },
        {
          name: 'medium',
          ttl: 300_000,
          limit: 100,
        },
      ],
      storage: new RedisThrottlerStorageService(),
    }),
  ],
  providers: [
    RedisThrottlerStorageService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [ThrottlerModule],
})
export class RateLimitModule {}
