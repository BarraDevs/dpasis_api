import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { CategoryDto } from '../../dtos/category.dto';
import type { ICategoryDao } from '../../persistence/dao/category-dao.interface';
import { FindAllCategoryQueryDto } from './dtos/find-all-category.dto';

@Injectable()
export class FindAllCategory {
  constructor(
    @Inject(TOKENS.CategoryDao) private readonly categoryDao: ICategoryDao,
  ) {}

  public async execute(queries: FindAllCategoryQueryDto): Promise<IPagination<CategoryDto>> {
    const [result, total] = await this.categoryDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
