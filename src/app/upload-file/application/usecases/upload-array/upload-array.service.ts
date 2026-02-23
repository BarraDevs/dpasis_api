import { Injectable } from '@nestjs/common';
import { UploadSingle } from '../upload-single/upload-single.service';
import { UploadArrayOutputDto } from './dtos/upload-array.dto';

@Injectable()
export class UploadArray {
  constructor(
    private uploadSingle: UploadSingle,
  ) {}

  public async execute(files: Array<Express.Multer.File>): Promise<UploadArrayOutputDto> {
    let urls: string[] = [];

    if (files) {
      const images = await Promise.all(
        files?.map(async(file) => await this.uploadSingle.execute(file))
      );

      urls = images.map(i => i.url);
    }

    return { urls };
  }
}
