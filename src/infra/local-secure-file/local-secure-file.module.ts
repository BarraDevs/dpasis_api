import { DynamicModule, Module } from '@nestjs/common';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { LocalSecureFileFakeAdapterGateway } from './adapters/fake/local-secure-file-fake.gateway';
import { LocalSecureFileFsAdapterGateway } from './adapters/fs/local-secure-file-fs.gateway';

@Module({})
export class LocalSecureFileModule {
  static register(): DynamicModule {
    const isTest = process.env.NODE_ENV === Environment.Test;

    return {
      module: LocalSecureFileModule,
      providers: [
        {
          provide: TOKENS.LocalSecureFileGateway,
          useClass: isTest ? LocalSecureFileFakeAdapterGateway : LocalSecureFileFsAdapterGateway,
        },
      ],
      exports: [
        TOKENS.LocalSecureFileGateway,
      ],
    };
  }
}
