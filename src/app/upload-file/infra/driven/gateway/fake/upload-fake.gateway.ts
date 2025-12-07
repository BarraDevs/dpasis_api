import { Injectable } from '@nestjs/common';
import { IUploadGateway } from 'src/app/upload-file/application/gateway/upload.gateway';

@Injectable()
export class UploadFakeAdapterGateway implements IUploadGateway {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async upload(_file: Express.Multer.File, _folder?: string): Promise<string> {
    return 'http://fake-url.com/' + Date.now();
  }
}
