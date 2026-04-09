import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { CategoryAlreadyExistsError } from '../../../domain/errors/category-already-exists.error';
import { CategoryNotFoundError } from '../../../domain/errors/category-not-found.error';
import type { ICategoryDao } from '../../persistence/dao/category-dao.interface';
import { EditCategoryInputDto } from './dtos/edit-category.dto';

@Injectable()
export class EditCategory {
  constructor(
    @Inject(TOKENS.CategoryDao) private readonly categoryDao: ICategoryDao,
  ) {}

  public async execute(id: number, data: EditCategoryInputDto): Promise<SuccessMessage> {
    const category = await this.categoryDao.findById(id);
    if (!category) {
      throw new CategoryNotFoundError();
    }

    const existing = await this.categoryDao.findByName(data.name.trim());
    if (existing && existing.id !== id) {
      throw new CategoryAlreadyExistsError(data.name);
    }

    await this.categoryDao.edit(id, data);

    return { message: 'Edição realizada com sucesso' };
  }
}
