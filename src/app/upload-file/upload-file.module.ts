import { Module, Provider } from '@nestjs/common';
import { UploadGatewayModule } from './application/gateway/upload-gateway.module';
import { UploadArray } from './application/usecases/upload-array/upload-array.service';
import { UploadSingle } from './application/usecases/upload-single/upload-single.service';

const providers: Provider[] = [
  UploadSingle,
  UploadArray,
];

@Module({
  imports: [
    UploadGatewayModule.register(),
  ],
  providers: [...providers],
  exports: [...providers],
})
export class UploadFileModule {}
