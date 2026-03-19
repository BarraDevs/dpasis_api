import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { ServiceCategoryAlreadyExistsError } from '../../../domain/errors/service-category-already-exists.error';
import type { IServiceCategoryDao } from '../../persistence/dao/service-category-dao.interface';
import { CreateServiceCategoryInputDto, CreateServiceCategoryOutputDto } from './dtos/create-service-category.dto';

@Injectable()
export class CreateServiceCategory {
  constructor(
    @Inject(TOKENS.ServiceCategoryDao) private readonly serviceCategoryDao: IServiceCategoryDao,
  ) {}

  public async execute(data: CreateServiceCategoryInputDto): Promise<CreateServiceCategoryOutputDto> {
    const existing = await this.serviceCategoryDao.findByName(data.name.trim());
    if (existing) {
      throw new ServiceCategoryAlreadyExistsError(data.name);
    }

    const id = await this.serviceCategoryDao.save(data);
    return { id };
  }
}
