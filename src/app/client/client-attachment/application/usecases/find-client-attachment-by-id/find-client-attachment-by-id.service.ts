import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { ClientAttachmentNotFoundError } from '../../../domain/errors/client-attachment-not-found.error';
import { ClientAttachmentDto } from '../../dtos/client-attachment.dto';
import type { IClientAttachmentDao } from '../../persistence/dao/client-attachment-dao.interface';

@Injectable()
export class FindClientAttachmentById {
  constructor(
    @Inject(TOKENS.ClientAttachmentDao) private readonly clientAttachmentDao: IClientAttachmentDao,
  ) {}

  public async execute(id: number): Promise<ClientAttachmentDto> {
    const attachment = await this.clientAttachmentDao.findById(id);
    if (!attachment) {
      throw new ClientAttachmentNotFoundError();
    }

    return attachment;
  }
}
