import { Inject, Injectable } from '@nestjs/common';
import { ServiceDuplicateCategoryError } from 'src/app/service-category/domain/errors/duplicate-service-category.error';
import { TOKENS } from 'src/core/di/token';
import type { IServiceCategoryDao } from '../../persistence/dao/service-category-dao.interface';
import { CreateServiceCategoryInputDto, CreateServiceCategoryOutputDto } from './dtos/create-service-category.dto';

@Injectable()
export class CreateServiceCategory {
  constructor(
    @Inject(TOKENS.ServiceCategoryDao) private readonly serviceCategoryDao: IServiceCategoryDao,
  ) {}

  public async execute(data: CreateServiceCategoryInputDto): Promise<CreateServiceCategoryOutputDto> {
    const alreadyExists = await this.serviceCategoryDao.findByName(data.name);
    if (alreadyExists) {
      throw new ServiceDuplicateCategoryError();
    }

    const serviceCategoryId = await this.serviceCategoryDao.save(data);

    return { id: serviceCategoryId };
  }
}
