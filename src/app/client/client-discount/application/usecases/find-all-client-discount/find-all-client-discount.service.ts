import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientDiscountDto } from '../../dtos/client-discount.dto';
import type { IClientDiscountDao } from '../../persistence/dao/client-discount-dao.interface';
import { FindAllClientDiscountQueryDto } from './dtos/find-all-client-discount.dto';

@Injectable()
export class FindAllClientDiscount {
  constructor(
    @Inject(TOKENS.ClientDiscountDao) private readonly clientDiscountDao: IClientDiscountDao,
  ) {}

  public async execute(queries: FindAllClientDiscountQueryDto): Promise<IPagination<ClientDiscountDto>> {
    const [result, total] = await this.clientDiscountDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
