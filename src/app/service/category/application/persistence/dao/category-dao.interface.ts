import { CategoryDto } from '../../dtos/category.dto';
import { CreateCategoryInputDto } from '../../usecases/create-category/dtos/create-category.dto';
import { EditCategoryInputDto } from '../../usecases/edit-category/dtos/edit-category.dto';
import { FindAllCategoryQueryDto } from '../../usecases/find-all-category/dtos/find-all-category.dto';

export interface ICategoryDao {
  findAll(queries: FindAllCategoryQueryDto): Promise<[CategoryDto[], number]>;
  findById(id: number): Promise<CategoryDto | null>;
  findByName(name: string): Promise<CategoryDto | null>;
  save(data: CreateCategoryInputDto): Promise<number>;
  edit(id: number, data: EditCategoryInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
  countServicesByCategoryId(categoryId: number): Promise<number>;
}
