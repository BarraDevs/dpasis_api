import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { NfGenerationFakeAdapterGateway } from './adapters/fake/nf-generation-fake.gateway';
import { NfGenerationNfemailAdapterGateway } from './adapters/nfemail/nf-generation-nfemail.gateway';

@Module({})
export class NfGenerationModule {
  static register(): DynamicModule {
    const isTest = process.env.NODE_ENV === Environment.Test;

    return {
      module: NfGenerationModule,
      imports: [
        ConfigModule,
        HttpModule,
      ],
      providers: [
        {
          provide: TOKENS.NfGenerationGateway,
          useClass: isTest ? NfGenerationFakeAdapterGateway : NfGenerationNfemailAdapterGateway,
        },
      ],
      exports: [
        TOKENS.NfGenerationGateway,
      ],
    };
  }
}
