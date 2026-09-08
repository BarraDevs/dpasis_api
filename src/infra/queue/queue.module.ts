import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Global, Module } from '@nestjs/common';
import basicAuth from 'express-basic-auth';
import { ConfigModule } from 'src/core/config/config.module';
import { ConfigService } from 'src/core/config/config.service';
import { isQueueEnabled } from './queue-environment';

@Global()
@Module({})
export class QueueModule {
  static register(): DynamicModule {
    if (!isQueueEnabled()) {
      return {
        module: QueueModule,
      };
    }

    return {
      module: QueueModule,
      imports: [
        BullModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => {
            const url = new URL(config.redisUrl);
            return {
              connection: {
                host: url.hostname,
                port: Number(url.port) || 6379,
                username: url.username ? decodeURIComponent(url.username) : undefined,
                password: url.password ? decodeURIComponent(url.password) : undefined,
                db: config.redisQueueDatabase,
              },
            };
          },
        }),
        BullBoardModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            route: '/admin/queues',
            adapter: ExpressAdapter,
            middleware: basicAuth({
              challenge: true,
              users: {
                [config.queueDashboardUsername]: config.queueDashboardPassword,
              },
            }),
          }),
        }),
      ],
    };
  }
}
