import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from '../../core/di/token';
import { CacheFakeAdapterGateway } from './adapters/fake/cache-fake.gateway';
import { CacheRedisAdapterGateway } from './adapters/redis/cache-redis.gateway';

@Global()
@Module({})
export class CacheModule {
  static forRoot(): DynamicModule {
    return {
      module: CacheModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: TOKENS.CacheGateway,
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            return configService.isTest
              ? new CacheFakeAdapterGateway()
              : CacheRedisAdapterGateway;
          },
        },
      ],
      exports: [
        TOKENS.CacheGateway,
      ],
    };
  }
}
