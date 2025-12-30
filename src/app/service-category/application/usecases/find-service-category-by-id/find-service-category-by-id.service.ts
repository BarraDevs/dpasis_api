import { Inject, Injectable } from '@nestjs/common';
import { ServiceCategoryNotFoundError } from 'src/app/service-category/domain/errors/service-category-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { ServiceCategoryDto } from '../../dtos/service-category.dto';
import type { IServiceCategoryDao } from '../../persistence/dao/service-category-dao.interface';

@Injectable()
export class FindServiceCategoryById {
  constructor(
    @Inject(TOKENS.ServiceCategoryDao) private readonly serviceCategoryDao: IServiceCategoryDao,
  ) {}

  public async execute(id: string): Promise<ServiceCategoryDto> {
    const serviceCategory = await this.serviceCategoryDao.findById(id);
    if (!serviceCategory) {
      throw new ServiceCategoryNotFoundError();
    }

    return serviceCategory;
  }
}
