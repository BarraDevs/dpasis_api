import { Global, Module } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { ConfigService } from 'src/core/config/config.service';
import { TOKENS } from 'src/core/di/token';
import { LoggerFakeAdapterGateway } from './adapters/fake/logger-fake.gateway';
import { LoggerWinstonAdapterGateway } from './adapters/winston/logger-winston.gateway';

@Global()
@Module({
  imports: [
    ConfigModule,
  ],
  providers: [
    {
      provide: TOKENS.LoggerGateway,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return configService.isTest
          ? new LoggerFakeAdapterGateway()
          : new LoggerWinstonAdapterGateway();
      },
    },
  ],
  exports: [
    TOKENS.LoggerGateway,
  ],
})
export class LoggerModule {}
