import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { Seller } from 'src/app/seller/domain/entities/seller.entity';
import { SellerDuplicateEmailError } from 'src/app/seller/domain/errors/duplicate-email.error';
import { SellerNotFoundError } from 'src/app/seller/domain/errors/seller-not-found.error';
import { UploadSingle } from 'src/app/upload-file/application/usecases/upload-single/upload-single.service';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { ISellerDao } from '../../persistence/dao/seller-dao.interface';
import type { ISellerRepository } from '../../persistence/repository/seller-repository.interface';
import { EditSellerInputDto } from './dtos/edit-seller.dto';

@Injectable()
export class EditSeller {
  constructor(
    @Inject(TOKENS.SellerDao) private readonly sellerDao: ISellerDao,
    @Inject(TOKENS.SellerRepository) private readonly sellerRepository: ISellerRepository,
    private readonly findCompanyById: FindCompanyById,
    private readonly uploadFileService: UploadSingle,
  ) {}

  public async execute(id: string, data: EditSellerInputDto, image?: Express.Multer.File): Promise<SuccessMessage> {
    const sellerData = await this.sellerDao.findById(id);
    if (!sellerData) {
      throw new SellerNotFoundError();
    }

    if (data.email && data.email !== sellerData.email) {
      const existingSellerWithEmail = await this.sellerDao.findByEmail(data.email);
      if (existingSellerWithEmail) {
        throw new SellerDuplicateEmailError();
      }
    }

    if (data.companyIds) {
      await Promise.all(
        data.companyIds.map(
          async(companyId) => await this.findCompanyById.execute(companyId),
        ),
      );
    }

    let newAvatarUrl: string | null = null;
    if (image) {
      const imageUploaded = await this.uploadFileService.execute(image, 'sellers/avatars');
      newAvatarUrl = imageUploaded.url;
    }

    const { companies, ...rest } = sellerData;
    const seller = Seller.load({
      ...rest,
      ...data,
      avatarUrl: newAvatarUrl ?? sellerData.avatarUrl,
      companyIds: data.companyIds ?? companies.map((company) => company.id),
    });

    await this.sellerRepository.edit(seller);

    return { message: 'Vendedor editado com sucesso!' };
  }
}
