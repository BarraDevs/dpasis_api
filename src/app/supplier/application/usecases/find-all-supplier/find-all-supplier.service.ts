import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { SupplierDto } from '../../dtos/supplier.dto';
import type { ISupplierDao } from '../../persistence/dao/supplier-dao.interface';
import { FindAllSupplierQueryDto } from './dtos/find-all-supplier.dto';

@Injectable()
export class FindAllSupplier {
  constructor(
    @Inject(TOKENS.SupplierDao) private readonly supplierDao: ISupplierDao,
  ) {}

  public async execute(queries: FindAllSupplierQueryDto): Promise<IPagination<SupplierDto>> {
    const [result, total] = await this.supplierDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
