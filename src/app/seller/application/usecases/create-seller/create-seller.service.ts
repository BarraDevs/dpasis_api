import { Inject, Injectable } from '@nestjs/common';
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
  ) {}

  public async execute(data: CreateSellerInputDto): Promise<CreateSellerOutputDto> {
    const entity = SellerFactory.create(data);

    const emailAlreadyTaken = await this.sellerDao.findByEmail(entity.props.email);
    if (emailAlreadyTaken) {
      throw new EmailAlreadyTakenError(data.email);
    }

    const id = await this.sellerRepository.save(entity);

    return { id };
  }
}
