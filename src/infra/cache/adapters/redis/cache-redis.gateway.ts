import { Inject, Injectable } from '@nestjs/common';
import type { RedisClientType } from 'redis';
import { TOKENS } from 'src/core/di/token';
import { REDIS_CLIENT } from 'src/infra/cache/redis.module';
import { type ILoggerGateway, LogContext } from 'src/infra/logger/logger.gateway';
import { ICacheGateway } from '../../cache.gateway';

@Injectable()
export class CacheRedisAdapterGateway implements ICacheGateway {
  private readonly ONE_DAY_IN_SECONDS = 86400;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType,
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
  ) {}

  public async set<T>(key: string, value: T, ttlInSeconds?: number, skipLog: boolean = false): Promise<void> {
    try {
      await this.redisClient.set(key, JSON.stringify(value));
      await this.redisClient.expire(
        key,
        ttlInSeconds && ttlInSeconds > 0 ? ttlInSeconds : this.ONE_DAY_IN_SECONDS,
      );
      if (skipLog) {
        return;
      }
      this.logger.debug(LogContext.CACHE, {
        adapter: 'redis',
        action: 'set',
        key,
        value,
        ttlInSeconds,
      });
    }
    catch (error) {
      this.logger.error(LogContext.CACHE, {
        adapter: 'redis',
        action: 'set',
        key,
        value,
        ttlInSeconds,
        error,
      });
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisClient.get(key);
      return value ? JSON.parse(value) : null;
    }
    catch (error) {
      this.logger.error(LogContext.CACHE, {
        adapter: 'redis',
        action: 'get',
        key,
        error,
      });
      return null;
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
      this.logger.debug(LogContext.CACHE, {
        adapter: 'redis',
        action: 'delete',
        key,
      });
    }
    catch (error) {
      this.logger.error(LogContext.CACHE, {
        adapter: 'redis',
        action: 'delete',
        key,
        error,
      });
    }
  }

  public async deleteContaining(key: string): Promise<void> {
    try {
      const keys: string[] = [];
      let cursor = 0;

      do {
        const result = await this.redisClient.scan(cursor, { MATCH: `*${key}*`, COUNT: 100 });
        cursor = result.cursor;
        keys.push(...result.keys);
      } while (cursor !== 0);

      if (keys.length > 0) {
        await this.redisClient.del(keys);
        this.logger.debug(LogContext.CACHE, {
          adapter: 'redis',
          action: 'deleteContaining',
          key: keys,
        });
      }
    }
    catch (error) {
      this.logger.error(LogContext.CACHE, {
        adapter: 'redis',
        action: 'deleteContaining',
        key,
        error,
      });
    }
  }
}
