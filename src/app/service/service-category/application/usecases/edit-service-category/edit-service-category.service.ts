import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ServiceCategoryAlreadyExistsError } from '../../../domain/errors/service-category-already-exists.error';
import { ServiceCategoryNotFoundError } from '../../../domain/errors/service-category-not-found.error';
import type { IServiceCategoryDao } from '../../persistence/dao/service-category-dao.interface';
import { EditServiceCategoryInputDto } from './dtos/edit-service-category.dto';

@Injectable()
export class EditServiceCategory {
  constructor(
    @Inject(TOKENS.ServiceCategoryDao) private readonly serviceCategoryDao: IServiceCategoryDao,
  ) {}

  public async execute(id: number, data: EditServiceCategoryInputDto): Promise<SuccessMessage> {
    const serviceCategory = await this.serviceCategoryDao.findById(id);
    if (!serviceCategory) {
      throw new ServiceCategoryNotFoundError();
    }

    const existing = await this.serviceCategoryDao.findByName(data.name.trim());
    if (existing && existing.id !== id) {
      throw new ServiceCategoryAlreadyExistsError(data.name);
    }

    await this.serviceCategoryDao.edit(id, data);

    return { message: 'Categoria de serviço atualizada com sucesso' };
  }
}
