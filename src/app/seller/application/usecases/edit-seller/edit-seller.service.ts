import { Inject, Injectable } from '@nestjs/common';
import type { IUploadFileQueueProducer } from 'src/app/upload-file/application/queue/upload-file-queue-producer.interface';
import { UploadSingle } from 'src/app/upload-file/application/usecases/upload-single/upload-single.service';
import { SellerNotFoundError } from 'src/app/seller/domain/errors/seller-not-found.error';
import { SellerFactory } from 'src/app/seller/domain/factories/seller.factory';
import { SellerProfilePictureFolder } from 'src/app/seller/domain/value-objects/seller-profile-picture-folder.vo';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { EmailAlreadyTakenError } from 'src/shared/errors/email-already-taken';
import type { ISellerDao } from '../../persistence/dao/seller-dao.interface';
import type { ISellerRepository } from '../../persistence/repository/seller-repository.interface';
import { EditSellerInputDto } from './dtos/edit-seller.dto';

@Injectable()
export class EditSeller {
  constructor(
    @Inject(TOKENS.SellerDao) private readonly sellerDao: ISellerDao,
    @Inject(TOKENS.SellerRepository) private readonly sellerRepository: ISellerRepository,
    @Inject(TOKENS.UploadFileQueueProducer) private readonly uploadFileQueueProducer: IUploadFileQueueProducer,
    private readonly uploadSingle: UploadSingle,
  ) {}

  public async execute(
    id: number,
    data: EditSellerInputDto,
    file?: Express.Multer.File,
  ): Promise<SuccessMessage> {
    const seller = await this.sellerDao.findById(id);
    if (!seller) {
      throw new SellerNotFoundError();
    }

    const previousProfilePictureUrl = seller.profilePictureUrl;

    let profilePictureUrl = previousProfilePictureUrl ?? null;

    if (file) {
      const folder = new SellerProfilePictureFolder(id);
      const result = await this.uploadSingle.execute(file, folder.value);
      profilePictureUrl = result.url;
    }

    const sellerEntity = SellerFactory.edit({
      id,
      name: data.name ?? seller.name,
      phone: data.phone ?? seller.phone,
      nickname: data.nickname !== undefined ? data.nickname : seller.nickname,
      whatsapp: data.whatsapp ?? seller.whatsapp,
      email: data.email ?? seller.email,
      commission: data.commission ?? seller.commission,
      profilePictureUrl,
      observation: data.observation !== undefined ? data.observation : seller.observation,
      zipCode: data.zipCode ?? seller.zipCode,
      street: data.street ?? seller.street,
      number: data.number ?? seller.number,
      complement: data.complement !== undefined ? data.complement : seller.complement,
      neighborhood: data.neighborhood ?? seller.neighborhood,
      city: data.city ?? seller.city,
      state: data.state ?? seller.state,
      active: seller.active,
    });

    if (data.email !== undefined) {
      const emailAlreadyTaken = await this.sellerDao.findByEmail(sellerEntity.props.email);
      if (emailAlreadyTaken && emailAlreadyTaken.id !== id) {
        throw new EmailAlreadyTakenError(data.email);
      }
    }

    await this.sellerRepository.edit(sellerEntity);

    if (file && previousProfilePictureUrl) {
      await this.uploadFileQueueProducer.addDeleteJob({ fileUrl: previousProfilePictureUrl });
    }

    return { message: 'Edição realizada com sucesso' };
  }
}
