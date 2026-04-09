import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { hasAnyPositiveReference } from 'src/shared/helpers/has-any-positive-reference';
import { CategoryInUseError } from '../../../domain/errors/category-in-use.error';
import { CategoryNotFoundError } from '../../../domain/errors/category-not-found.error';
import type { ICategoryDao } from '../../persistence/dao/category-dao.interface';

@Injectable()
export class DeleteCategory {
  constructor(
    @Inject(TOKENS.CategoryDao) private readonly categoryDao: ICategoryDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const category = await this.categoryDao.findById(id);
    if (!category) {
      throw new CategoryNotFoundError();
    }

    const inUse = await hasAnyPositiveReference([
      () => this.categoryDao.countServicesByCategoryId(id),
    ]);
    if (inUse) {
      throw new CategoryInUseError();
    }

    await this.categoryDao.delete(id);

    return { message: 'Exclusão realizada com sucesso' };
  }
}
