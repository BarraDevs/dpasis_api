import { ServiceCatalog } from 'src/app/service/service-catalog/domain/entities/service-catalog.entity';

export interface IServiceCatalogRepository {
  save(entity: ServiceCatalog): Promise<number>;
  edit(entity: ServiceCatalog): Promise<void>;
  findById(id: number): Promise<ServiceCatalog | null>;
  delete(id: number): Promise<void>;
}
