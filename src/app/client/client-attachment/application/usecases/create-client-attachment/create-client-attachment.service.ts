import { Inject, Injectable } from '@nestjs/common';
import { UploadSingle } from 'src/app/upload-file/application/usecases/upload-single/upload-single.service';
import { TOKENS } from 'src/core/di/token';
import { ClientAttachmentFolder } from '../../../domain/value-objects/client-attachment-folder.vo';
import type { IClientAttachmentDao } from '../../persistence/dao/client-attachment-dao.interface';
import { CreateClientAttachmentInputDto, CreateClientAttachmentOutputDto } from './dtos/create-client-attachment.dto';

@Injectable()
export class CreateClientAttachment {
  constructor(
    @Inject(TOKENS.ClientAttachmentDao) private readonly clientAttachmentDao: IClientAttachmentDao,
    private readonly uploadSingle: UploadSingle,
  ) {}

  public async execute(file: Express.Multer.File, data: CreateClientAttachmentInputDto): Promise<CreateClientAttachmentOutputDto> {
    const folder = new ClientAttachmentFolder(data.clientId);
    const { url } = await this.uploadSingle.execute(file, folder.value);

    const id = await this.clientAttachmentDao.save({
      clientId: data.clientId,
      description: data.description,
      link: url,
    });

    return { id };
  }
}
