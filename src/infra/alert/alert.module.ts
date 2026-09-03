import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { AlertFakeAdapterGateway } from './adapters/fake/alert-fake.gateway';
import { AlertSmtpAdapterGateway } from './adapters/smtp/alert-smtp.gateway';

@Module({})
export class AlertModule {
  static register(): DynamicModule {
    const isTest = process.env.NODE_ENV === Environment.Test;

    return {
      module: AlertModule,
      imports: [
        ConfigModule,
      ],
      providers: [
        {
          provide: TOKENS.AlertGateway,
          useClass: isTest ? AlertFakeAdapterGateway : AlertSmtpAdapterGateway,
        },
      ],
      exports: [
        TOKENS.AlertGateway,
      ],
    };
  }
}
