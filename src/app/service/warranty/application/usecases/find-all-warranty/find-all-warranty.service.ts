import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { WarrantyDto } from '../../dtos/warranty.dto';
import type { IWarrantyDao } from '../../persistence/dao/warranty-dao.interface';
import { FindAllWarrantyQueryDto } from './dtos/find-all-warranty.dto';

@Injectable()
export class FindAllWarranty {
  constructor(
    @Inject(TOKENS.WarrantyDao) private readonly warrantyDao: IWarrantyDao,
  ) {}

  public async execute(queries: FindAllWarrantyQueryDto): Promise<IPagination<WarrantyDto>> {
    const [result, total] = await this.warrantyDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
