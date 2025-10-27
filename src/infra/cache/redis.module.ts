import { Module } from '@nestjs/common';
import { createClient } from 'redis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

// doing this way to use same redis client in everything (cache, queues, etc)
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: async() => {
        const client = createClient({
          url: process.env.REDIS_URL,
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
