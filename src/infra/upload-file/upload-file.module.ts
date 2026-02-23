import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from 'src/core/config/config.module';
import { Environment } from 'src/core/config/environment.enum';
import { TOKENS } from 'src/core/di/token';
import { UploadS3AdapterGateway } from './adapters/aws-s3/upload-s3.gateway';
import { UploadFakeAdapterGateway } from './adapters/fake/upload-fake.gateway';

@Module({})
export class UploadFileModule {
  static register(): DynamicModule {
    const isTest = process.env.NODE_ENV === Environment.Test;

    return {
      module: UploadFileModule,
      imports: [
        ConfigModule,
      ],
      providers: [
        {
          provide: TOKENS.UploadFileGateway,
          useClass: isTest ? UploadFakeAdapterGateway : UploadS3AdapterGateway,
        },
      ],
      exports: [
        TOKENS.UploadFileGateway,
      ],
    };
  }
}
