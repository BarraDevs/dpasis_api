import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { ServiceCategoryNotFoundError } from '../../../domain/errors/service-category-not-found.error';
import { ServiceCategoryDto } from '../../dtos/service-category.dto';
import type { IServiceCategoryDao } from '../../persistence/dao/service-category-dao.interface';

@Injectable()
export class FindServiceCategoryById {
  constructor(
    @Inject(TOKENS.ServiceCategoryDao) private readonly serviceCategoryDao: IServiceCategoryDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<ServiceCategoryDto> {
    const serviceCategory = await this.serviceCategoryDao.findById(id);
    if (!serviceCategory) {
      throw new ServiceCategoryNotFoundError();
    }
    if (options.onlyActive && !serviceCategory.active) {
      throw new ServiceCategoryNotFoundError();
    }

    return serviceCategory;
  }
}
