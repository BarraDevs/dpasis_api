import { Inject, Injectable } from '@nestjs/common';
import type { IUploadFileQueueProducer } from 'src/app/upload-file/application/queue/upload-file-queue-producer.interface';
import { UploadSingle } from 'src/app/upload-file/application/usecases/upload-single/upload-single.service';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientAttachmentNotFoundError } from '../../../domain/errors/client-attachment-not-found.error';
import { ClientAttachmentFolder } from '../../../domain/value-objects/client-attachment-folder.vo';
import type { IClientAttachmentDao } from '../../persistence/dao/client-attachment-dao.interface';
import { EditClientAttachmentInputDto } from './dtos/edit-client-attachment.dto';

@Injectable()
export class EditClientAttachment {
  constructor(
    @Inject(TOKENS.ClientAttachmentDao) private readonly clientAttachmentDao: IClientAttachmentDao,
    @Inject(TOKENS.UploadFileQueueProducer) private readonly uploadFileQueueProducer: IUploadFileQueueProducer,
    private readonly uploadSingle: UploadSingle,
  ) {}

  public async execute(id: number, data: EditClientAttachmentInputDto, file?: Express.Multer.File): Promise<SuccessMessage> {
    const attachment = await this.clientAttachmentDao.findById(id);
    if (!attachment) {
      throw new ClientAttachmentNotFoundError();
    }

    if (file) {
      const folder = new ClientAttachmentFolder(attachment.clientId);
      const { url } = await this.uploadSingle.execute(file, folder.value);

      await this.clientAttachmentDao.edit(id, { ...data, link: url });
      await this.uploadFileQueueProducer.addDeleteJob({ fileUrl: attachment.link });
    }
    else {
      await this.clientAttachmentDao.edit(id, data);
    }

    return { message: 'Anexo do cliente atualizado com sucesso' };
  }
}
