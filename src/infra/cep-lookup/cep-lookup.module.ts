import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { CepLookupFakeAdapterGateway } from './adapters/fake/cep-lookup-fake.gateway';
import { CepLookupViacepAdapterGateway } from './adapters/viacep/cep-lookup-viacep.gateway';

@Module({})
export class CepLookupModule {
  static register(): DynamicModule {
    const isTest = process.env.NODE_ENV === Environment.Test;

    return {
      module: CepLookupModule,
      imports: [
        ConfigModule,
        HttpModule,
      ],
      providers: [
        {
          provide: TOKENS.CepLookupGateway,
          useClass: isTest ? CepLookupFakeAdapterGateway : CepLookupViacepAdapterGateway,
        },
      ],
      exports: [
        TOKENS.CepLookupGateway,
      ],
    };
  }
}
