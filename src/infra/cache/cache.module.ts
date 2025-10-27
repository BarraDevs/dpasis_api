import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from '../../core/di/token';
import { LoggerModule } from '../logger/logger.module';
import { CacheFakeAdapterGateway } from './adapters/fake/cache-fake.gateway';
import { CacheRedisAdapterGateway } from './adapters/redis/cache-redis.gateway';
import { RedisModule } from './redis.module';

@Global()
@Module({})
export class CacheModule {
  static forRoot(): DynamicModule {
    const isTest = process.env.NODE_ENV === Environment.Test;

    const adapter: Provider = {
      provide: TOKENS.CacheGateway,
      useClass: isTest ? CacheFakeAdapterGateway : CacheRedisAdapterGateway,
    };

    return {
      module: CacheModule,
      imports: isTest ? [] : [RedisModule, LoggerModule.forRoot()],
      providers: [adapter],
      exports: [adapter],
    };
  }
}
