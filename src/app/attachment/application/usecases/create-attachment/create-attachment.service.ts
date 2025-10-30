import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { IAttachmentDao } from '../../persistence/dao/attachment-dao.interface';
import { CreateAttachmentInputDto, CreateAttachmentOutputDto } from './dtos/create-attachment.dto';

@Injectable()
export class CreateAttachment {
  constructor(
    @Inject(TOKENS.AttachmentDao) private readonly attachmentDao: IAttachmentDao,
  ) {}

  public async execute(data: CreateAttachmentInputDto): Promise<CreateAttachmentOutputDto> {
    const attachmentId = await this.attachmentDao.save(data);
    return { id: attachmentId };
  }
}
