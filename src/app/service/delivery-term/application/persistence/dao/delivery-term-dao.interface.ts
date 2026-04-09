import { DeliveryTermDto } from '../../dtos/delivery-term.dto';
import { CreateDeliveryTermInputDto } from '../../usecases/create-delivery-term/dtos/create-delivery-term.dto';
import { EditDeliveryTermInputDto } from '../../usecases/edit-delivery-term/dtos/edit-delivery-term.dto';
import { FindAllDeliveryTermQueryDto } from '../../usecases/find-all-delivery-term/dtos/find-all-delivery-term.dto';

export interface IDeliveryTermDao {
  findAll(queries: FindAllDeliveryTermQueryDto): Promise<[DeliveryTermDto[], number]>;
  findById(id: number): Promise<DeliveryTermDto | null>;
  findByName(name: string): Promise<DeliveryTermDto | null>;
  save(data: CreateDeliveryTermInputDto): Promise<number>;
  edit(id: number, data: EditDeliveryTermInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
  countServicesByDeliveryTermId(deliveryTermId: number): Promise<number>;
}
