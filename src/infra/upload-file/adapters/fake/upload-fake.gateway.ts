import { Injectable } from '@nestjs/common';
import { IUploadFileGateway } from '../../upload-file.gateway';

@Injectable()
export class UploadFakeAdapterGateway implements IUploadFileGateway {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async upload(_file: Express.Multer.File, _folder?: string): Promise<string> {
    return 'http://fake-url.com/' + Date.now();
  }
}
