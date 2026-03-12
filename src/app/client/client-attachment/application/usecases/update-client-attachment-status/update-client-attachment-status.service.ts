import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientAttachmentNotFoundError } from '../../../domain/errors/client-attachment-not-found.error';
import type { IClientAttachmentDao } from '../../persistence/dao/client-attachment-dao.interface';

@Injectable()
export class UpdateClientAttachmentStatus {
  constructor(
    @Inject(TOKENS.ClientAttachmentDao) private readonly clientAttachmentDao: IClientAttachmentDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const attachment = await this.clientAttachmentDao.findById(id);
    if (!attachment) {
      throw new ClientAttachmentNotFoundError();
    }

    await this.clientAttachmentDao.updateStatus(id, !attachment.active);

    return { message: 'Status do anexo do cliente atualizado com sucesso' };
  }
}
