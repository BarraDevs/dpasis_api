import { Inject, Injectable } from '@nestjs/common';
import type { IUploadFileQueueProducer } from 'src/app/upload-file/application/queue/upload-file-queue-producer.interface';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientSystemTypeImageUrlSharedError } from '../../../domain/errors/client-system-type-image-url-shared.error';
import { ClientSystemTypeInUseError } from '../../../domain/errors/client-system-type-in-use.error';
import { ClientSystemTypeNotFoundError } from '../../../domain/errors/client-system-type-not-found.error';
import type { IClientSystemTypeDao } from '../../persistence/dao/client-system-type-dao.interface';

@Injectable()
export class DeleteClientSystemType {
  constructor(
    @Inject(TOKENS.ClientSystemTypeDao) private readonly clientSystemTypeDao: IClientSystemTypeDao,
    @Inject(TOKENS.UploadFileQueueProducer) private readonly uploadFileQueueProducer: IUploadFileQueueProducer,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const clientSystemType = await this.clientSystemTypeDao.findById(id);
    if (!clientSystemType) {
      throw new ClientSystemTypeNotFoundError();
    }

    const clientTypesCount = await this.clientSystemTypeDao.countClientTypesBySystemTypeId(id);
    if (clientTypesCount > 0) {
      throw new ClientSystemTypeInUseError();
    }

    if (clientSystemType.imageUrl) {
      const othersWithSameImageUrl = await this.clientSystemTypeDao.findByImageUrlExcludingId(clientSystemType.imageUrl, id);
      if (othersWithSameImageUrl > 0) {
        throw new ClientSystemTypeImageUrlSharedError();
      }
    }

    await this.clientSystemTypeDao.delete(id);

    if (clientSystemType.imageUrl) {
      await this.uploadFileQueueProducer.addDeleteJob({ fileUrl: clientSystemType.imageUrl });
    }

    return { message: 'Tipo de sistema de cliente excluído com sucesso' };
  }
}
