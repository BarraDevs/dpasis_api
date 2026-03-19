import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ServiceCategoryDto } from '../../dtos/service-category.dto';
import type { IServiceCategoryDao } from '../../persistence/dao/service-category-dao.interface';
import { FindAllServiceCategoryQueryDto } from './dtos/find-all-service-category.dto';

@Injectable()
export class FindAllServiceCategory {
  constructor(
    @Inject(TOKENS.ServiceCategoryDao) private readonly serviceCategoryDao: IServiceCategoryDao,
  ) {}

  public async execute(queries: FindAllServiceCategoryQueryDto): Promise<IPagination<ServiceCategoryDto>> {
    const [result, total] = await this.serviceCategoryDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
