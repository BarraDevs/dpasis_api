import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { CategoryNotFoundError } from '../../../domain/errors/category-not-found.error';
import type { ICategoryDao } from '../../persistence/dao/category-dao.interface';

@Injectable()
export class UpdateCategoryStatus {
  constructor(
    @Inject(TOKENS.CategoryDao) private readonly categoryDao: ICategoryDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const category = await this.categoryDao.findById(id);
    if (!category) {
      throw new CategoryNotFoundError();
    }

    await this.categoryDao.updateStatus(id, !category.active);

    return { message: 'Status da categoria atualizado com sucesso' };
  }
}
