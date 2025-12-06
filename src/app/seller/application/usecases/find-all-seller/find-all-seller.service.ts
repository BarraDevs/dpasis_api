import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { SellerDto } from '../../dtos/seller.dto';
import type { ISellerDao } from '../../persistence/dao/seller-dao.interface';
import { FindAllSellerQueryDto } from './dtos/find-all-seller.dto';

@Injectable()
export class FindAllSeller {
  constructor(
    @Inject(TOKENS.SellerDao) private sellerDao: ISellerDao,
  ) {}

  public async execute(queries: FindAllSellerQueryDto): Promise<IPagination<SellerDto>> {
    const [result, total] = await this.sellerDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
