import { Inject, Injectable } from '@nestjs/common';
import { ServiceCategoryNotFoundError } from 'src/app/service-category/domain/errors/service-category-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IServiceCategoryDao } from '../../persistence/dao/service-category-dao.interface';

@Injectable()
export class DeleteServiceCategory {
  constructor(
    @Inject(TOKENS.ServiceCategoryDao) private readonly serviceCategoryDao: IServiceCategoryDao,
  ) {}

  public async execute(id: string): Promise<SuccessMessage> {
    const serviceCategory = await this.serviceCategoryDao.findById(id);
    if (!serviceCategory) {
      throw new ServiceCategoryNotFoundError();
    }

    await this.serviceCategoryDao.delete(id);

    return { message: 'Categoria de serviço deletada com sucesso!' };
  }
}
