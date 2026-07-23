import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { NfsGenerationFakeAdapterGateway } from './adapters/fake/nfs-generation-fake.gateway';
import { NfsGenerationGissAdapterGateway } from './adapters/giss/nfs-generation-giss.gateway';

@Module({})
export class NfsGenerationModule {
  static register(): DynamicModule {
    const isTest = process.env.NODE_ENV === Environment.Test;

    return {
      module: NfsGenerationModule,
      imports: [
        ConfigModule,
        HttpModule,
      ],
      providers: [
        {
          provide: TOKENS.NfsGenerationGateway,
          useClass: isTest ? NfsGenerationFakeAdapterGateway : NfsGenerationGissAdapterGateway,
        },
      ],
      exports: [
        TOKENS.NfsGenerationGateway,
      ],
    };
  }
}
