import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { Seller } from 'src/app/seller/domain/entities/seller.entity';
import { SellerDuplicateEmailError } from 'src/app/seller/domain/errors/duplicate-email.error';
import { SellerNotFoundError } from 'src/app/seller/domain/errors/seller-not-found.error';
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
  ) {}

  public async execute(id: string, data: EditSellerInputDto): Promise<SuccessMessage> {
    const sellerData = await this.sellerDao.findById(id);
    if (!sellerData) {
      throw new SellerNotFoundError();
    }

    const { companies, ...rest } = sellerData;

    const seller = Seller.load({
      ...rest,
      ...data,
      companyIds: data.companyIds ?? companies.map((company) => company.id),
    });

    if (data.email && seller.props.email !== sellerData.email) {
      const existingSellerWithEmail = await this.sellerDao.findByEmail(seller.props.email);
      if (existingSellerWithEmail) {
        throw new SellerDuplicateEmailError();
      }
    }

    if (data.companyIds) {
      await Promise.all(
        seller.props.companyIds.map(
          async(companyId) => await this.findCompanyById.execute(companyId),
        ),
      );
    }

    await this.sellerRepository.edit(seller);

    return { message: 'Vendedor editado com sucesso!' };
  }
}
