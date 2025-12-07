import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { LoggerModule } from 'src/infra/logger/logger.module';
import { UploadS3AdapterGateway } from '../../infra/driven/gateway/aws-s3/upload-s3.gateway';
import { UploadFakeAdapterGateway } from '../../infra/driven/gateway/fake/upload-fake.gateway';

@Module({})
export class UploadGatewayModule {
  static register(): DynamicModule {
    const isTest = process.env.NODE_ENV === Environment.Test;

    return {
      module: UploadGatewayModule,
      imports: [
        ConfigModule,
        LoggerModule,
      ],
      providers: [
        {
          provide: TOKENS.UploadGateway,
          useClass: isTest ? UploadFakeAdapterGateway : UploadS3AdapterGateway,
        },
      ],
      exports: [
        TOKENS.UploadGateway,
      ],
    };
  }
}
