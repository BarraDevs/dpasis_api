import { Module } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception/http-exception.filter';

@Module({
  providers: [
    {
      provide: 'APP_FILTER',
      useClass: HttpExceptionFilter,
    },
  ],
})
export class FilterModule {}
