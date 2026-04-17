import { Inject, Injectable } from '@nestjs/common';
import type { IUploadFileQueueProducer } from 'src/app/upload-file/application/queue/upload-file-queue-producer.interface';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientAttachmentLinkSharedError } from '../../../domain/errors/client-attachment-link-shared.error';
import { ClientAttachmentNotFoundError } from '../../../domain/errors/client-attachment-not-found.error';
import type { IClientAttachmentDao } from '../../persistence/dao/client-attachment-dao.interface';

@Injectable()
export class DeleteClientAttachment {
  constructor(
    @Inject(TOKENS.ClientAttachmentDao) private readonly clientAttachmentDao: IClientAttachmentDao,
    @Inject(TOKENS.UploadFileQueueProducer) private readonly uploadFileQueueProducer: IUploadFileQueueProducer,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const attachment = await this.clientAttachmentDao.findById(id);
    if (!attachment) {
      throw new ClientAttachmentNotFoundError();
    }

    const othersWithSameLink = await this.clientAttachmentDao.findByLinkExcludingId(attachment.link, id);
    if (othersWithSameLink > 0) {
      throw new ClientAttachmentLinkSharedError();
    }

    await this.clientAttachmentDao.delete(id);
    await this.uploadFileQueueProducer.addDeleteJob({ fileUrl: attachment.link });

    return { message: 'Anexo do cliente excluído com sucesso' };
  }
}
