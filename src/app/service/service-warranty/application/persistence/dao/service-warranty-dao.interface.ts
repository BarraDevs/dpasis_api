import { ServiceWarrantyDto } from '../../dtos/service-warranty.dto';
import { CreateServiceWarrantyInputDto } from '../../usecases/create-service-warranty/dtos/create-service-warranty.dto';
import { EditServiceWarrantyInputDto } from '../../usecases/edit-service-warranty/dtos/edit-service-warranty.dto';
import { FindAllServiceWarrantyQueryDto } from '../../usecases/find-all-service-warranty/dtos/find-all-service-warranty.dto';

export interface IServiceWarrantyDao {
  findAll(queries: FindAllServiceWarrantyQueryDto): Promise<[ServiceWarrantyDto[], number]>;
  findById(id: number): Promise<ServiceWarrantyDto | null>;
  findByName(name: string): Promise<ServiceWarrantyDto | null>;
  save(data: CreateServiceWarrantyInputDto): Promise<number>;
  edit(id: number, data: EditServiceWarrantyInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
}
