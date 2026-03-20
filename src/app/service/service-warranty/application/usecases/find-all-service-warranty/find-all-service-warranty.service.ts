import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ServiceWarrantyDto } from '../../dtos/service-warranty.dto';
import type { IServiceWarrantyDao } from '../../persistence/dao/service-warranty-dao.interface';
import { FindAllServiceWarrantyQueryDto } from './dtos/find-all-service-warranty.dto';

@Injectable()
export class FindAllServiceWarranty {
  constructor(
    @Inject(TOKENS.ServiceWarrantyDao) private readonly serviceWarrantyDao: IServiceWarrantyDao,
  ) {}

  public async execute(queries: FindAllServiceWarrantyQueryDto): Promise<IPagination<ServiceWarrantyDto>> {
    const [result, total] = await this.serviceWarrantyDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
