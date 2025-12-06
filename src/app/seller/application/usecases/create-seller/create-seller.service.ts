import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { Seller } from 'src/app/seller/domain/entities/seller.entity';
import { SellerDuplicateEmailError } from 'src/app/seller/domain/errors/duplicate-email.error';
import { TOKENS } from 'src/core/di/token';
import { Password } from 'src/shared/value-objects/password/password.vo';
import type { ISellerDao } from '../../persistence/dao/seller-dao.interface';
import type { ISellerRepository } from '../../persistence/repository/seller-repository.interface';
import { CreateSellerInputDto, CreateSellerOutputDto } from './dtos/create-seller.dto';

@Injectable()
export class CreateSeller {
  constructor(
    @Inject(TOKENS.SellerDao) private readonly sellerDao: ISellerDao,
    @Inject(TOKENS.SellerRepository) private readonly sellerRepository: ISellerRepository,
    private readonly findCompanyById: FindCompanyById,
  ) {}

  public async execute(data: CreateSellerInputDto): Promise<CreateSellerOutputDto> {
    const seller = Seller.create(data);

    const duplicateEmail = await this.sellerDao.findByEmail(seller.props.email);
    if (duplicateEmail) {
      throw new SellerDuplicateEmailError();
    }

    // Verify if each company exists
    await Promise.all(
      seller.props.companyIds.map(
        async(companyId) => this.findCompanyById.execute(companyId),
      ),
    );

    // Generate random password and hash it
    const plainPassword = Password.generateRandom();
    const hashedPassword = new Password(plainPassword).value;

    await this.sellerRepository.save(seller, hashedPassword);

    return { id: seller.props.id };
  }
}
