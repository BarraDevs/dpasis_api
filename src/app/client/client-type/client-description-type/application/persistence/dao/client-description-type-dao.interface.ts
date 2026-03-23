import { ClientDescriptionTypeDto } from '../../dtos/client-description-type.dto';
import { CreateClientDescriptionTypeInputDto } from '../../usecases/create-client-description-type/dtos/create-client-description-type.dto';
import { EditClientDescriptionTypeInputDto } from '../../usecases/edit-client-description-type/dtos/edit-client-description-type.dto';
import { FindAllClientDescriptionTypeQueryDto } from '../../usecases/find-all-client-description-type/dtos/find-all-client-description-type.dto';

export interface IClientDescriptionTypeDao {
  findAll(queries: FindAllClientDescriptionTypeQueryDto): Promise<[ClientDescriptionTypeDto[], number]>;
  findById(id: number): Promise<ClientDescriptionTypeDto | null>;
  findByName(name: string): Promise<ClientDescriptionTypeDto | null>;
  save(data: CreateClientDescriptionTypeInputDto): Promise<number>;
  edit(id: number, data: EditClientDescriptionTypeInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
  countClientTypesByDescriptionTypeId(descriptionTypeId: number): Promise<number>;
}
