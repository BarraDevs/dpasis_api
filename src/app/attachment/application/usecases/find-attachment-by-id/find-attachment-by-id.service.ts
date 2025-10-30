import { Inject, Injectable } from '@nestjs/common';
import { AttachmentNotFoundError } from 'src/app/attachment/domain/errors/attachment-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { AttachmentDto } from '../../dtos/attachment.dto';
import type { IAttachmentDao } from '../../persistence/dao/attachment-dao.interface';

@Injectable()
export class FindAttachmentById {
  constructor(
    @Inject(TOKENS.AttachmentDao) private readonly attachmentDao: IAttachmentDao,
  ) {}

  public async execute(id: string): Promise<AttachmentDto> {
    const attachment = await this.attachmentDao.findById(id);
    if (!attachment) {
      throw new AttachmentNotFoundError();
    }
    return attachment;
  }
}
