import { Inject, Injectable } from '@nestjs/common';
import { AttachmentNotFoundError } from 'src/app/attachment/domain/errors/attachment-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IAttachmentDao } from '../../persistence/dao/attachment-dao.interface';
import { EditAttachmentInputDto } from './dtos/edit-attachment.dto';

@Injectable()
export class EditAttachment {
  constructor(
    @Inject(TOKENS.AttachmentDao) private readonly attachmentDao: IAttachmentDao,
  ) {}

  public async execute(id: string, data: EditAttachmentInputDto): Promise<SuccessMessage> {
    const attachment = await this.attachmentDao.findById(id);
    if (!attachment) {
      throw new AttachmentNotFoundError();
    }

    await this.attachmentDao.edit(id, data);

    return { message: 'Anexo atualizado com sucesso!' };
  }
}
