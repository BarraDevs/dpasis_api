import { Module, Provider } from '@nestjs/common';
import { UploadFileModule as UploadFileModuleInfra } from 'src/infra/upload-file/upload-file.module';
import { UploadArray } from './application/usecases/upload-array/upload-array.service';
import { UploadSingle } from './application/usecases/upload-single/upload-single.service';

const providers: Provider[] = [
  UploadSingle,
  UploadArray,
];

@Module({
  imports: [
    UploadFileModuleInfra.register(),
  ],
  providers: [...providers],
  exports: [...providers],
})
export class UploadFileModule {}
