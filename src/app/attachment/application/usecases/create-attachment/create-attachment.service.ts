import { Inject, Injectable } from '@nestjs/common';
import { FindOwnerById } from 'src/app/owner/application/usecases/find-owner-by-id/find-owner-by-id.service';
import { TOKENS } from 'src/core/di/token';
import type { IAttachmentDao } from '../../persistence/dao/attachment-dao.interface';
import { CreateAttachmentInputDto, CreateAttachmentOutputDto } from './dtos/create-attachment.dto';

@Injectable()
export class CreateAttachment {
  constructor(
    @Inject(TOKENS.AttachmentDao) private readonly attachmentDao: IAttachmentDao,
    private readonly findOwnerById: FindOwnerById,
  ) {}

  public async execute(data: CreateAttachmentInputDto): Promise<CreateAttachmentOutputDto> {
    // Validate owner existence
    const owner = await this.findOwnerById.execute(data.ownerId);

    const attachmentId = await this.attachmentDao.save({ ...data, ownerId: owner.id });
    return { id: attachmentId };
  }
}
