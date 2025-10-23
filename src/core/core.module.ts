import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { FilterModule } from './filters/filter.module';

@Module({
  imports: [
    ConfigModule,
    FilterModule,
  ],
})
export class CoreModule {}
