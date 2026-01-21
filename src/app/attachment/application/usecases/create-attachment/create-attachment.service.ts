import { Inject, Injectable } from '@nestjs/common';
import { FindOwnerById } from 'src/app/owner/application/usecases/find-owner-by-id/find-owner-by-id.service';
import { OwnerNotActiveError } from 'src/app/owner/domain/errors/owner-not-active.error';
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
    const owner = await this.findOwnerById.execute(data.ownerId);
    if (!owner.active) {
      throw new OwnerNotActiveError();
    }

    const attachmentId = await this.attachmentDao.save({ ...data, ownerId: owner.id });
    return { id: attachmentId };
  }
}
