import { Inject, Injectable } from '@nestjs/common';
import type { IUploadFileQueueProducer } from 'src/app/upload-file/application/queue/upload-file-queue-producer.interface';
import { SellerNotFoundError } from 'src/app/seller/domain/errors/seller-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { ISellerRepository } from '../../persistence/repository/seller-repository.interface';

@Injectable()
export class DeleteSeller {
  constructor(
    @Inject(TOKENS.SellerRepository) private readonly sellerRepository: ISellerRepository,
    @Inject(TOKENS.UploadFileQueueProducer) private readonly uploadFileQueueProducer: IUploadFileQueueProducer,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const seller = await this.sellerRepository.findById(id);
    if (!seller) {
      throw new SellerNotFoundError();
    }

    const profilePictureUrl = seller.props.profilePictureUrl;

    await this.sellerRepository.delete(id);

    if (profilePictureUrl) {
      await this.uploadFileQueueProducer.addDeleteJob({ fileUrl: profilePictureUrl });
    }

    return { message: 'Vendedor excluído com sucesso' };
  }
}
