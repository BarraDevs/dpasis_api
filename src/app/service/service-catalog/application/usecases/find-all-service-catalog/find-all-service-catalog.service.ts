import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ServiceCatalogDto } from '../../dtos/service-catalog.dto';
import type { IServiceCatalogDao } from '../../persistence/dao/service-catalog-dao.interface';
import { FindAllServiceCatalogQueryDto } from './dtos/find-all-service-catalog.dto';

@Injectable()
export class FindAllServiceCatalog {
  constructor(
    @Inject(TOKENS.ServiceCatalogDao) private readonly serviceCatalogDao: IServiceCatalogDao,
  ) {}

  public async execute(queries: FindAllServiceCatalogQueryDto): Promise<IPagination<ServiceCatalogDto>> {
    const [result, total] = await this.serviceCatalogDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
