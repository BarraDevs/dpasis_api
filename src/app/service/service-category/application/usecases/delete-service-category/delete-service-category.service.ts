import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ServiceCategoryInUseError } from '../../../domain/errors/service-category-in-use.error';
import { ServiceCategoryNotFoundError } from '../../../domain/errors/service-category-not-found.error';
import type { IServiceCategoryDao } from '../../persistence/dao/service-category-dao.interface';

@Injectable()
export class DeleteServiceCategory {
  constructor(
    @Inject(TOKENS.ServiceCategoryDao) private readonly serviceCategoryDao: IServiceCategoryDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const serviceCategory = await this.serviceCategoryDao.findById(id);
    if (!serviceCategory) {
      throw new ServiceCategoryNotFoundError();
    }

    const servicesCount = await this.serviceCategoryDao.countServicesByCategoryId(id);
    if (servicesCount > 0) {
      throw new ServiceCategoryInUseError();
    }

    await this.serviceCategoryDao.delete(id);

    return { message: 'Categoria de serviço excluída com sucesso' };
  }
}
