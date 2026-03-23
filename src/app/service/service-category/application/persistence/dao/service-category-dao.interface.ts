import { ServiceCategoryDto } from '../../dtos/service-category.dto';
import { CreateServiceCategoryInputDto } from '../../usecases/create-service-category/dtos/create-service-category.dto';
import { EditServiceCategoryInputDto } from '../../usecases/edit-service-category/dtos/edit-service-category.dto';
import { FindAllServiceCategoryQueryDto } from '../../usecases/find-all-service-category/dtos/find-all-service-category.dto';

export interface IServiceCategoryDao {
  findAll(queries: FindAllServiceCategoryQueryDto): Promise<[ServiceCategoryDto[], number]>;
  findById(id: number): Promise<ServiceCategoryDto | null>;
  findByName(name: string): Promise<ServiceCategoryDto | null>;
  save(data: CreateServiceCategoryInputDto): Promise<number>;
  edit(id: number, data: EditServiceCategoryInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
  countServicesByCategoryId(categoryId: number): Promise<number>;
}
