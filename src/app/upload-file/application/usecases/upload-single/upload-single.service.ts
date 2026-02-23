import { Inject, Injectable } from '@nestjs/common';
import { FileTooBigError } from 'src/app/upload-file/domain/errors/file-too-big.error';
import { InvalidFileError } from 'src/app/upload-file/domain/errors/invalid-file.error';
import { RequiredFileError } from 'src/app/upload-file/domain/errors/required-file.error';
import { TOKENS } from 'src/core/di/token';
import type { IUploadFileGateway } from 'src/infra/upload-file/upload-file.gateway';
import { UploadSingleOutputDto } from './dtos/upload-single.dto';

@Injectable()
export class UploadSingle {
  private readonly TWENTY_MEGABYTES = 20 * 1024 * 1024;
  private readonly SUPPORTED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'application/octet-stream', // for ios files
  ];

  constructor(
    @Inject(TOKENS.UploadFileGateway) private readonly uploadFileGateway: IUploadFileGateway
  ) {}

  public async execute(file: Express.Multer.File, folder?: string): Promise<UploadSingleOutputDto> {
    if (!file) {
      throw new RequiredFileError();
    }
    if (file.size > this.TWENTY_MEGABYTES) {
      throw new FileTooBigError(this.TWENTY_MEGABYTES);
    }
    if (!this.SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
      throw new InvalidFileError(this.SUPPORTED_MIME_TYPES);
    }

    const url = await this.uploadFileGateway.upload(file, folder);

    return { url };
  }
}
