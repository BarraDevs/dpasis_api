import { DynamicModule, Module } from '@nestjs/common';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { CertificateParserFakeAdapterGateway } from './adapters/fake/certificate-parser-fake.gateway';
import { CertificateParserForgeAdapterGateway } from './adapters/forge/certificate-parser-forge.gateway';

@Module({})
export class CertificateParserModule {
  static register(): DynamicModule {
    const isTest = process.env.NODE_ENV === Environment.Test;

    return {
      module: CertificateParserModule,
      providers: [
        {
          provide: TOKENS.CertificateParserGateway,
          useClass: isTest ? CertificateParserFakeAdapterGateway : CertificateParserForgeAdapterGateway,
        },
      ],
      exports: [
        TOKENS.CertificateParserGateway,
      ],
    };
  }
}
