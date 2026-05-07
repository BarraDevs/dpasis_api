import { Module } from '@nestjs/common';
import { CacheModule } from './cache/cache.module';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logger.module';
import { QueueModule } from './queue/queue.module';
import { ThrottleModule } from './throttle/throttle.module';

@Module({
  imports: [
    CacheModule.register(),
    DatabaseModule,
    LoggerModule,
    QueueModule.register(),
    ThrottleModule,
  ],
})
export class InfraModule {}
