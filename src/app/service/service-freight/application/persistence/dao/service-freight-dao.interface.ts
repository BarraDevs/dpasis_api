import { ServiceFreightDto } from '../../dtos/service-freight.dto';
import { CreateServiceFreightInputDto } from '../../usecases/create-service-freight/dtos/create-service-freight.dto';
import { EditServiceFreightInputDto } from '../../usecases/edit-service-freight/dtos/edit-service-freight.dto';
import { FindAllServiceFreightQueryDto } from '../../usecases/find-all-service-freight/dtos/find-all-service-freight.dto';

export interface IServiceFreightDao {
  findAll(queries: FindAllServiceFreightQueryDto): Promise<[ServiceFreightDto[], number]>;
  findById(id: number): Promise<ServiceFreightDto | null>;
  findByName(name: string): Promise<ServiceFreightDto | null>;
  save(data: CreateServiceFreightInputDto): Promise<number>;
  edit(id: number, data: EditServiceFreightInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
}
