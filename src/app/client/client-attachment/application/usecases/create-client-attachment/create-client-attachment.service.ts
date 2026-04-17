import { Inject, Injectable } from '@nestjs/common';
import { FindClientById } from 'src/app/client/client/application/usecases/find-client-by-id/find-client-by-id.service';
import { UploadSingle } from 'src/app/upload-file/application/usecases/upload-single/upload-single.service';
import { RequiredFileError } from 'src/app/upload-file/domain/errors/required-file.error';
import { TOKENS } from 'src/core/di/token';
import { ClientAttachmentFolder } from '../../../domain/value-objects/client-attachment-folder.vo';
import type { IClientAttachmentDao } from '../../persistence/dao/client-attachment-dao.interface';
import { CreateClientAttachmentInputDto, CreateClientAttachmentOutputDto } from './dtos/create-client-attachment.dto';

@Injectable()
export class CreateClientAttachment {
  constructor(
    @Inject(TOKENS.ClientAttachmentDao) private readonly clientAttachmentDao: IClientAttachmentDao,
    private readonly findClientById: FindClientById,
    private readonly uploadSingle: UploadSingle,
  ) {}

  public async execute(data: CreateClientAttachmentInputDto, file: Express.Multer.File | undefined): Promise<CreateClientAttachmentOutputDto> {
    const client = await this.findClientById.execute(data.clientId, { onlyActive: true });

    let link: string;
    if (data.link !== null && data.link !== undefined) {
      link = data.link;
    }
    else {
      if (!file) throw new RequiredFileError();
      const folder = new ClientAttachmentFolder(client.id);
      const result = await this.uploadSingle.execute(file, folder.value);
      link = result.url;
    }

    const id = await this.clientAttachmentDao.save({
      clientId: client.id,
      description: data.description,
      link,
    });

    return { id };
  }
}
