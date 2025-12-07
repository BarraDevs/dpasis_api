import { Inject, Injectable } from '@nestjs/common';
import { FileTooBigError } from 'src/app/upload-file/domain/errors/file-too-big.error';
import { FileIsRequiredError } from 'src/app/upload-file/domain/errors/generic-upload-file.error';
import { InvalidFileError } from 'src/app/upload-file/domain/errors/invalid-file.error';
import { TOKENS } from 'src/core/di/token';
import type { IUploadGateway } from '../../gateway/upload.gateway';
import { UploadSingleOutputDto } from './dtos/upload-single.dto';

@Injectable()
export class UploadSingle {
  private readonly TWENTY_MEGABYTES = 1024 * 1024 * 20;
  private readonly SUPPORTED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'application/octet-stream', // for ios files
  ];

  constructor(
    @Inject(TOKENS.UploadGateway) private readonly uploadGateway: IUploadGateway
  ) {}

  public async execute(file: Express.Multer.File, folder?: string): Promise<UploadSingleOutputDto> {
    if (!file) {
      throw new FileIsRequiredError();
    }
    if (file.size > this.TWENTY_MEGABYTES) {
      throw new FileTooBigError();
    }
    if (!this.SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
      throw new InvalidFileError();
    }

    const url = await this.uploadGateway.upload(file, folder);

    return { url };
  }
}
