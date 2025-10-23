import { Module } from '@nestjs/common';
import { LoggerModule } from 'src/infra/logger/logger.module';
import { HttpExceptionFilter } from './http-exception/http-exception.filter';

@Module({
  imports: [
    LoggerModule.forRoot(),
  ],
  providers: [
    {
      provide: 'APP_FILTER',
      useClass: HttpExceptionFilter,
    },
  ],
})
export class FilterModule {}
