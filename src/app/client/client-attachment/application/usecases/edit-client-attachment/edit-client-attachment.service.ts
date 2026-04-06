import { Inject, Injectable } from '@nestjs/common';
import type { IUploadFileQueueProducer } from 'src/app/upload-file/application/queue/upload-file-queue-producer.interface';
import { FileTooBigError } from 'src/app/upload-file/domain/errors/file-too-big.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IUploadFileGateway } from 'src/infra/upload-file/upload-file.gateway';
import { ClientAttachmentNotFoundError } from '../../../domain/errors/client-attachment-not-found.error';
import { CLIENT_ATTACHMENT_MAX_FILE_BYTES, CLIENT_ATTACHMENT_S3_FOLDER } from '../../constants/client-attachment-upload.constants';
import type { IClientAttachmentDao } from '../../persistence/dao/client-attachment-dao.interface';
import { EditClientAttachmentInputDto } from './dtos/edit-client-attachment.dto';

@Injectable()
export class EditClientAttachment {
  constructor(
    @Inject(TOKENS.ClientAttachmentDao) private readonly clientAttachmentDao: IClientAttachmentDao,
    @Inject(TOKENS.UploadFileGateway) private readonly uploadFileGateway: IUploadFileGateway,
    @Inject(TOKENS.UploadFileQueueProducer) private readonly uploadFileQueueProducer: IUploadFileQueueProducer,
  ) {}

  public async execute(id: number, data: EditClientAttachmentInputDto, file?: Express.Multer.File): Promise<SuccessMessage> {
    const attachment = await this.clientAttachmentDao.findById(id);
    if (!attachment) {
      throw new ClientAttachmentNotFoundError();
    }

    if (file) {
      if (file.size > CLIENT_ATTACHMENT_MAX_FILE_BYTES) {
        throw new FileTooBigError(CLIENT_ATTACHMENT_MAX_FILE_BYTES / 1024 / 1024);
      }
      // TODO(alinhamento com cliente): validar MIME
      // const allowedMimeTypes = [...];

      const newLink = await this.uploadFileGateway.upload(file, CLIENT_ATTACHMENT_S3_FOLDER);
      await this.clientAttachmentDao.edit(id, { ...data, link: newLink });

      await this.uploadFileQueueProducer.addDeleteJob({ fileUrl: attachment.link });
    }
    else {
      await this.clientAttachmentDao.edit(id, data);
    }

    return { message: 'Anexo do cliente atualizado com sucesso' };
  }
}
