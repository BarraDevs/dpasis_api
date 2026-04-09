import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { CategoryNotFoundError } from '../../../domain/errors/category-not-found.error';
import { CategoryDto } from '../../dtos/category.dto';
import type { ICategoryDao } from '../../persistence/dao/category-dao.interface';

@Injectable()
export class FindCategoryById {
  constructor(
    @Inject(TOKENS.CategoryDao) private readonly categoryDao: ICategoryDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<CategoryDto> {
    const category = await this.categoryDao.findById(id);
    if (!category) {
      throw new CategoryNotFoundError();
    }
    if (options.onlyActive && !category.active) {
      throw new CategoryNotFoundError();
    }

    return category;
  }
}
