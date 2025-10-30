import { Inject, Injectable } from '@nestjs/common';
import { AttachmentNotFoundError } from 'src/app/attachment/domain/errors/attachment-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IAttachmentDao } from '../../persistence/dao/attachment-dao.interface';

@Injectable()
export class DeleteAttachment {
  constructor(
    @Inject(TOKENS.AttachmentDao) private readonly attachmentDao: IAttachmentDao,
  ) {}

  public async execute(id: string): Promise<SuccessMessage> {
    const attachment = await this.attachmentDao.findById(id);
    if (!attachment) {
      throw new AttachmentNotFoundError();
    }

    await this.attachmentDao.delete(id);

    return { message: 'Anexo deletado com sucesso!' };
  }
}
