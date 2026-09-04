import { Inject, Injectable } from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { type ILoggerGateway, LogContext } from 'src/infra/logger/logger.gateway';
import { ICacheGateway } from '../../cache.gateway';

@Injectable()
export class CacheRedisAdapterGateway implements ICacheGateway {
  private readonly ONE_DAY_IN_SECONDS = 86400;
  private client: RedisClientType | null = null;

  constructor(
    @Inject(TOKENS.LoggerGateway) private readonly logger: ILoggerGateway,
    private readonly configService: ConfigService,
  ) {
    this.connectToRedis();
  }

  private async connectToRedis(): Promise<void> {
    if (this.client?.isOpen) {
      return;
    }

    try {
      this.client = createClient({
        url: this.configService.redisUrl,
        database: this.configService.redisCacheDatabase,
      });
      await this.client.connect();
    }
    catch (error) {
      this.logger.error(LogContext.CACHE, {
        adapter: 'redis',
        action: 'connect',
        key: this.configService.redisUrl,
        error,
      });
      this.client = null;
    }
  }

  public async set<T>(key: string, value: T, ttlInSeconds?: number, skipLog: boolean = false): Promise<void> {
    try {
      await this.client?.set(key, JSON.stringify(value));
      await this.client?.expire(
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

  /**
   * `false` significa **uma** coisa só: outro processo já tem a chave. Redis fora do ar relança, em
   * vez de devolver `false`, porque os dois casos exigem decisões opostas de quem chama — uma trava
   * perdida é motivo para desistir, uma trava que não pôde ser verificada não é. Engolir a falha
   * aqui fazia a varredura de alertas tratar "não consegui avisar" como "outra réplica avisou", e o
   * alerta sumia em silêncio justamente durante o incidente.
   */
  public async setIfAbsent<T>(key: string, value: T, ttlInSeconds: number): Promise<boolean> {
    if (!this.client) {
      throw new Error('Cache indisponível: cliente Redis não conectado');
    }

    try {
      const result = await this.client.set(key, JSON.stringify(value), { NX: true, EX: ttlInSeconds });
      return result === 'OK';
    }
    catch (error) {
      this.logger.error(LogContext.CACHE, {
        adapter: 'redis',
        action: 'setIfAbsent',
        key,
        value,
        ttlInSeconds,
        error,
      });
      throw error;
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client?.get(key);
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
      await this.client?.del(key);
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
      // node-redis v5 mudou o cursor de SCAN de number para string; '0' marca início e fim do ciclo.
      let cursor = '0';

      do {
        const result = await this.client?.scan(cursor, { MATCH: `*${key}*`, COUNT: 100 });
        if (!result) {
          break;
        }
        cursor = result.cursor;
        keys.push(...result.keys);
      } while (cursor !== '0');

      if (keys.length > 0) {
        await this.client?.del(keys);
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
