import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { SecretsCryptoAesGcmAdapterGateway } from './adapters/aes-gcm/secrets-crypto-aes-gcm.gateway';
import { SecretsCryptoFakeAdapterGateway } from './adapters/fake/secrets-crypto-fake.gateway';

@Module({})
export class SecretsCryptoModule {
  static register(): DynamicModule {
    const isTest = process.env.NODE_ENV === Environment.Test;

    return {
      module: SecretsCryptoModule,
      imports: [
        ConfigModule,
      ],
      providers: [
        {
          provide: TOKENS.SecretsCryptoGateway,
          useClass: isTest ? SecretsCryptoFakeAdapterGateway : SecretsCryptoAesGcmAdapterGateway,
        },
      ],
      exports: [
        TOKENS.SecretsCryptoGateway,
      ],
    };
  }
}
