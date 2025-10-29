import { DynamicModule, Global, Module } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConfigModule } from 'src/core/config/config.module';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from '../../core/di/token';
import { CacheFakeAdapterGateway } from './adapters/fake/cache-fake.gateway';
import { CacheRedisAdapterGateway } from './adapters/redis/cache-redis.gateway';

@Global()
@Module({})
export class CacheModule {
  static register(): DynamicModule {
    return {
      module: CacheModule,
      imports: [
        ConfigModule,
      ],
      providers: [
        CacheFakeAdapterGateway,
        CacheRedisAdapterGateway,
        {
          provide: TOKENS.CacheGateway,
          inject: [
            ConfigService,
            ModuleRef,
            CacheFakeAdapterGateway,
            CacheRedisAdapterGateway,
          ],
          useFactory: (configService: ConfigService, moduleRef: ModuleRef) => {
            const gateway = configService.isTest
              ? CacheFakeAdapterGateway
              : CacheRedisAdapterGateway;

            return moduleRef.get(gateway);
          },
        },
      ],
      exports: [
        TOKENS.CacheGateway,
      ],
    };
  }
}
