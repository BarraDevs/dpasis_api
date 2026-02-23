import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { CnpjLookupCnpjaAdapterGateway } from './adapters/cnpja/cnpj-lookup-cnpja.gateway';
import { CnpjLookupFakeAdapterGateway } from './adapters/fake/cnpj-lookup-fake.gateway';

@Module({})
export class CnpjLookupModule {
  static register(): DynamicModule {
    const isTest = process.env.NODE_ENV === Environment.Test;

    return {
      module: CnpjLookupModule,
      imports: [
        ConfigModule,
        HttpModule,
      ],
      providers: [
        {
          provide: TOKENS.CnpjLookupGateway,
          useClass: isTest ? CnpjLookupFakeAdapterGateway : CnpjLookupCnpjaAdapterGateway,
        },
      ],
      exports: [
        TOKENS.CnpjLookupGateway,
      ],
    };
  }
}
