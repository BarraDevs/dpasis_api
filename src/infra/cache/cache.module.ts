import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from '../../core/di/token';
import { CacheFakeAdapterGateway } from './adapters/fake/cache-fake.gateway';
import { CacheRedisAdapterGateway } from './adapters/redis/cache-redis.gateway';

@Global()
@Module({})
export class CacheModule {
  static register(): DynamicModule {
    const isTest = process.env.NODE_ENV === Environment.Test;

    return {
      module: CacheModule,
      imports: [
        ConfigModule,
      ],
      providers: [
        {
          provide: TOKENS.CacheGateway,
          useClass: isTest ? CacheFakeAdapterGateway : CacheRedisAdapterGateway,
        },
      ],
      exports: [
        TOKENS.CacheGateway,
      ],
    };
  }
}
