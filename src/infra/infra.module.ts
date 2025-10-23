import { Module } from '@nestjs/common';
import { CacheModule } from './cache/cache.module';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [
    DatabaseModule,
    CacheModule.forRoot(),
    LoggerModule.forRoot(),
  ],
  exports: [
    DatabaseModule,
    CacheModule,
    LoggerModule,
  ],
})
export class InfraModule {}
