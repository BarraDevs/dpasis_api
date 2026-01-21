import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { CompanyNotActiveError } from 'src/app/company/domain/errors/company-not-active.error';
import { Seller } from 'src/app/seller/domain/entities/seller.entity';
import { SellerDuplicateEmailError } from 'src/app/seller/domain/errors/duplicate-email.error';
import { SellerNotFoundError } from 'src/app/seller/domain/errors/seller-not-found.error';
import { UploadSingle } from 'src/app/upload-file/application/usecases/upload-single/upload-single.service';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { UTCDate } from 'src/shared/value-objects/utc-date/utc-date.vo';
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
      const companies = await Promise.all(
        data.companyIds.map(
          async(companyId) => await this.findCompanyById.execute(companyId),
        ),
      );
      companies.forEach((company) => {
        if (!company.active) {
          throw new CompanyNotActiveError(company.fantasyName);
        }
      });
    }

    // TODO: se houver um novo upload, remover o antigo da storage (implementar usando events)
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
      updatedAt: UTCDate.create().value,
    });

    await this.sellerRepository.edit(seller);

    return { message: 'Vendedor editado com sucesso!' };
  }
}
