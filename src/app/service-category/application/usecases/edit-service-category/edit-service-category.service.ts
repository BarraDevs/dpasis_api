import { Inject, Injectable } from '@nestjs/common';
import { ServiceDuplicateCategoryError } from 'src/app/service-category/domain/errors/duplicate-service-category.error';
import { ServiceCategoryNotFoundError } from 'src/app/service-category/domain/errors/service-category-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IServiceCategoryDao } from '../../persistence/dao/service-category-dao.interface';
import { EditServiceCategoryInputDto } from './dtos/edit-service-category.dto';

@Injectable()
export class EditServiceCategory {
  constructor(
    @Inject(TOKENS.ServiceCategoryDao) private readonly serviceCategoryDao: IServiceCategoryDao,
  ) {}

  public async execute(id: string, data: EditServiceCategoryInputDto): Promise<SuccessMessage> {
    const serviceCategory = await this.serviceCategoryDao.findById(id);
    if (!serviceCategory) {
      throw new ServiceCategoryNotFoundError();
    }

    const alreadyExists = await this.serviceCategoryDao.findByName(data.name);
    if (alreadyExists && alreadyExists.id !== id) {
      throw new ServiceDuplicateCategoryError();
    }

    await this.serviceCategoryDao.edit(id, data);

    return { message: 'Categoria de serviço atualizada com sucesso!' };
  }
}
