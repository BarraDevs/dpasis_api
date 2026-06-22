import { Inject, Injectable } from '@nestjs/common';
import { SellerNotFoundError } from 'src/app/seller/domain/errors/seller-not-found.error';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { SellerDto } from '../../dtos/seller.dto';
import type { ISellerDao } from '../../persistence/dao/seller-dao.interface';

@Injectable()
export class FindSellerById {
  constructor(
    @Inject(TOKENS.SellerDao) private readonly sellerDao: ISellerDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<SellerDto> {
    const result = await this.sellerDao.findById(id);
    if (!result) {
      throw new SellerNotFoundError();
    }
    if (options.onlyActive && !result.active) {
      throw new SellerNotFoundError();
    }

    return result;
  }
}
