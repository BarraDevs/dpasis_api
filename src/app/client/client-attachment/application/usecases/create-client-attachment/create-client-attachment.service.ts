import { Inject, Injectable } from '@nestjs/common';
import { FileTooBigError } from 'src/app/upload-file/domain/errors/file-too-big.error';
import { RequiredFileError } from 'src/app/upload-file/domain/errors/required-file.error';
import { TOKENS } from 'src/core/di/token';
import type { IUploadFileGateway } from 'src/infra/upload-file/upload-file.gateway';
import { CLIENT_ATTACHMENT_MAX_FILE_BYTES, CLIENT_ATTACHMENT_S3_FOLDER } from '../../constants/client-attachment-upload.constants';
import type { IClientAttachmentDao } from '../../persistence/dao/client-attachment-dao.interface';
import { CreateClientAttachmentInputDto, CreateClientAttachmentOutputDto } from './dtos/create-client-attachment.dto';

@Injectable()
export class CreateClientAttachment {
  constructor(
    @Inject(TOKENS.ClientAttachmentDao) private readonly clientAttachmentDao: IClientAttachmentDao,
    @Inject(TOKENS.UploadFileGateway) private readonly uploadFileGateway: IUploadFileGateway,
  ) {}

  public async execute(file: Express.Multer.File, data: CreateClientAttachmentInputDto): Promise<CreateClientAttachmentOutputDto> {
    if (!file) {
      throw new RequiredFileError();
    }
    if (file.size > CLIENT_ATTACHMENT_MAX_FILE_BYTES) {
      throw new FileTooBigError(CLIENT_ATTACHMENT_MAX_FILE_BYTES / 1024 / 1024);
    }
    // TODO: validar MIME
    // const allowedMimeTypes = ['image/jpeg', 'application/pdf', ...];
    // if (!allowedMimeTypes.includes(file.mimetype)) { ... }

    const link = await this.uploadFileGateway.upload(file, CLIENT_ATTACHMENT_S3_FOLDER);
    const id = await this.clientAttachmentDao.save({
      clientId: data.clientId,
      description: data.description,
      link,
    });

    return { id };
  }
}
