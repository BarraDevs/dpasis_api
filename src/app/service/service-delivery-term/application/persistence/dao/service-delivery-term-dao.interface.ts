import { ServiceDeliveryTermDto } from '../../dtos/service-delivery-term.dto';
import { CreateServiceDeliveryTermInputDto } from '../../usecases/create-service-delivery-term/dtos/create-service-delivery-term.dto';
import { EditServiceDeliveryTermInputDto } from '../../usecases/edit-service-delivery-term/dtos/edit-service-delivery-term.dto';
import { FindAllServiceDeliveryTermQueryDto } from '../../usecases/find-all-service-delivery-term/dtos/find-all-service-delivery-term.dto';

export interface IServiceDeliveryTermDao {
  findAll(queries: FindAllServiceDeliveryTermQueryDto): Promise<[ServiceDeliveryTermDto[], number]>;
  findById(id: number): Promise<ServiceDeliveryTermDto | null>;
  findByName(name: string): Promise<ServiceDeliveryTermDto | null>;
  save(data: CreateServiceDeliveryTermInputDto): Promise<number>;
  edit(id: number, data: EditServiceDeliveryTermInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
}
