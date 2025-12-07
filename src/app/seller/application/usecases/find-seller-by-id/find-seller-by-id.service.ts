import { Inject, Injectable } from '@nestjs/common';
import { SellerNotFoundError } from 'src/app/seller/domain/errors/seller-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SellerDto } from '../../dtos/seller.dto';
import type { ISellerDao } from '../../persistence/dao/seller-dao.interface';

@Injectable()
export class FindSellerById {
  constructor(
    @Inject(TOKENS.SellerDao) private readonly sellerDao: ISellerDao
  ) {}

  public async execute(id: string): Promise<SellerDto> {
    const seller = await this.sellerDao.findById(id);
    if (!seller) {
      throw new SellerNotFoundError();
    }

    return seller;
  }
}

