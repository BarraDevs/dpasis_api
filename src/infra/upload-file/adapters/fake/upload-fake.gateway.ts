/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { IUploadFileGateway } from '../../upload-file.gateway';

@Injectable()
export class UploadFakeAdapterGateway implements IUploadFileGateway {
  public async upload(_file: Express.Multer.File, _folder?: string): Promise<string> {
    return 'http://fake-url.com/' + Date.now();
  }

  public async delete(_publicUrl: string): Promise<void> {}
}
