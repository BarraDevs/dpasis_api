import { ServiceCatalogDto } from '../../dtos/service-catalog.dto';
import { FindAllServiceCatalogQueryDto } from '../../usecases/find-all-service-catalog/dtos/find-all-service-catalog.dto';

export interface IServiceCatalogDao {
  findAll(queries: FindAllServiceCatalogQueryDto): Promise<[ServiceCatalogDto[], number]>;
  findById(id: number): Promise<ServiceCatalogDto | null>;
}
