import { Inject, Injectable } from '@nestjs/common';
import type { IUploadFileQueueProducer } from 'src/app/upload-file/application/queue/upload-file-queue-producer.interface';
import { UploadSingle } from 'src/app/upload-file/application/usecases/upload-single/upload-single.service';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientSystemTypeAlreadyExistsError } from '../../../domain/errors/client-system-type-already-exists.error';
import { ClientSystemTypeNotFoundError } from '../../../domain/errors/client-system-type-not-found.error';
import { ClientSystemTypeImageFolder } from '../../../domain/value-objects/client-system-type-image-folder.vo';
import type { IClientSystemTypeDao } from '../../persistence/dao/client-system-type-dao.interface';
import { EditClientSystemTypeInputDto } from './dtos/edit-client-system-type.dto';

@Injectable()
export class EditClientSystemType {
  constructor(
    @Inject(TOKENS.ClientSystemTypeDao) private readonly clientSystemTypeDao: IClientSystemTypeDao,
    @Inject(TOKENS.UploadFileQueueProducer) private readonly uploadFileQueueProducer: IUploadFileQueueProducer,
    private readonly uploadSingle: UploadSingle,
  ) {}

  public async execute(id: number, data: EditClientSystemTypeInputDto, file?: Express.Multer.File): Promise<SuccessMessage> {
    const clientSystemType = await this.clientSystemTypeDao.findById(id);
    if (!clientSystemType) {
      throw new ClientSystemTypeNotFoundError();
    }

    const existing = await this.clientSystemTypeDao.findByName(data.name);
    if (existing && existing.id !== id) {
      throw new ClientSystemTypeAlreadyExistsError(data.name);
    }

    let newImageUrl: string | null | undefined;

    if (data.imageUrl !== null && data.imageUrl !== undefined) {
      newImageUrl = data.imageUrl;
    }
    else if (file) {
      const folder = new ClientSystemTypeImageFolder();
      const result = await this.uploadSingle.execute(file, folder.value);
      newImageUrl = result.url;
    }

    await this.clientSystemTypeDao.edit(id, {
      name: data.name,
      ...(newImageUrl !== undefined ? { imageUrl: newImageUrl } : {}),
    });

    if (newImageUrl && clientSystemType.imageUrl) {
      await this.uploadFileQueueProducer.addDeleteJob({ fileUrl: clientSystemType.imageUrl });
    }

    return { message: 'Tipo de sistema de cliente atualizado com sucesso' };
  }
}
