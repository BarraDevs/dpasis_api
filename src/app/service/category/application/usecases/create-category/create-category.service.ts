import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { CategoryAlreadyExistsError } from '../../../domain/errors/category-already-exists.error';
import type { ICategoryDao } from '../../persistence/dao/category-dao.interface';
import { CreateCategoryInputDto, CreateCategoryOutputDto } from './dtos/create-category.dto';

@Injectable()
export class CreateCategory {
  constructor(
    @Inject(TOKENS.CategoryDao) private readonly categoryDao: ICategoryDao,
  ) {}

  public async execute(data: CreateCategoryInputDto): Promise<CreateCategoryOutputDto> {
    const existing = await this.categoryDao.findByName(data.name.trim());
    if (existing) {
      throw new CategoryAlreadyExistsError(data.name);
    }

    const id = await this.categoryDao.save(data);
    return { id };
  }
}
