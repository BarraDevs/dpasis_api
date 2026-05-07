import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { syncThrottleRuntime } from './throttle.runtime';
import { ConfigService } from 'src/core/config/config.service';
import { ConfigModule } from 'src/core/config/config.module';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const limit = config.throttleLimit;
        const ttlMs = config.throttleTtlMs;
        syncThrottleRuntime(limit, ttlMs);
        return {
          throttlers: [{ name: 'default', ttl: ttlMs, limit }],
          skipIf: () => config.isTest,
        };
      },
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class ThrottleModule {}
