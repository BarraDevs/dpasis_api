import { Inject, Injectable } from '@nestjs/common';
import { SellerNotFoundError } from 'src/app/seller/domain/errors/seller-not-found.error';
import { SellerFactory } from 'src/app/seller/domain/factories/seller.factory';
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
  ) {}

  public async execute(id: number, data: EditSellerInputDto): Promise<SuccessMessage> {
    const seller = await this.sellerDao.findById(id);
    if (!seller) {
      throw new SellerNotFoundError();
    }

    const sellerEntity = SellerFactory.edit({
      ...seller,
      ...data,
      id,
      active: seller.active,
    });

    if (data.email !== undefined) {
      const emailAlreadyTaken = await this.sellerDao.findByEmail(sellerEntity.props.email);
      if (emailAlreadyTaken && emailAlreadyTaken.id !== id) {
        throw new EmailAlreadyTakenError(data.email);
      }
    }

    await this.sellerRepository.edit(sellerEntity);

    return { message: 'Edição realizada com sucesso' };
  }
}
