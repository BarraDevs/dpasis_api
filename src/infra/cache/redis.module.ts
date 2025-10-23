import { Module } from '@nestjs/common';
import { createClient } from 'redis';
import { ConfigModule } from 'src/core/config/config.module';
import { ConfigService } from 'src/core/config/config.service';

export const REDIS_CLIENT = 'REDIS_CLIENT';

// doing this way to use same redis client in everything (cache, queues, etc)
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigModule],
      useFactory: async(configService: ConfigService) => {
        const client = createClient({
          url: configService.redisUrl,
        });

        try {
          await client.connect();
          return client;
        } catch (error) {
          console.error('Failed to connect to Redis:', error);
        }
      },
    },
  ],
  exports: [
    REDIS_CLIENT,
  ],
})
export class RedisModule {}
