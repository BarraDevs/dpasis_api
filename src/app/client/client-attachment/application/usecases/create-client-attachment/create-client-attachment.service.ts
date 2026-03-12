import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { IClientAttachmentDao } from '../../persistence/dao/client-attachment-dao.interface';
import { CreateClientAttachmentInputDto, CreateClientAttachmentOutputDto } from './dtos/create-client-attachment.dto';

@Injectable()
export class CreateClientAttachment {
  constructor(
    @Inject(TOKENS.ClientAttachmentDao) private readonly clientAttachmentDao: IClientAttachmentDao,
  ) {}

  public async execute(data: CreateClientAttachmentInputDto): Promise<CreateClientAttachmentOutputDto> {
    const id = await this.clientAttachmentDao.save(data);
    return { id };
  }
}
