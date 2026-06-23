import { Inject, Injectable } from '@nestjs/common';
import { UploadSingle } from 'src/app/upload-file/application/usecases/upload-single/upload-single.service';
import { SellerProfilePictureFolder } from 'src/app/seller/domain/value-objects/seller-profile-picture-folder.vo';
import { SellerFactory } from 'src/app/seller/domain/factories/seller.factory';
import { TOKENS } from 'src/core/di/token';
import { EmailAlreadyTakenError } from 'src/shared/errors/email-already-taken';
import type { ISellerDao } from '../../persistence/dao/seller-dao.interface';
import type { ISellerRepository } from '../../persistence/repository/seller-repository.interface';
import { CreateSellerInputDto, CreateSellerOutputDto } from './dtos/create-seller.dto';

@Injectable()
export class CreateSeller {
  constructor(
    @Inject(TOKENS.SellerDao) private readonly sellerDao: ISellerDao,
    @Inject(TOKENS.SellerRepository) private readonly sellerRepository: ISellerRepository,
    private readonly uploadSingle: UploadSingle,
  ) {}

  public async execute(
    data: CreateSellerInputDto,
    file?: Express.Multer.File,
  ): Promise<CreateSellerOutputDto> {
    const entity = SellerFactory.create({
      ...data,
      nickname: data.nickname ?? null,
      observation: data.observation ?? null,
      complement: data.complement ?? null,
      profilePictureUrl: null,
    });

    const emailAlreadyTaken = await this.sellerDao.findByEmail(entity.props.email);
    if (emailAlreadyTaken) {
      throw new EmailAlreadyTakenError(data.email);
    }

    const id = await this.sellerRepository.save(entity);

    if (file) {
      const folder = new SellerProfilePictureFolder(id);
      const upload = await this.uploadSingle.execute(file, folder.value);

      const sellerWithPicture = SellerFactory.edit({
        ...entity.props,
        id,
        profilePictureUrl: upload.url,
      });
      await this.sellerRepository.edit(sellerWithPicture);
    }

    return { id };
  }
}
