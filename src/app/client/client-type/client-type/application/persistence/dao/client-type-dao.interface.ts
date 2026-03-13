import { ClientTypeDto } from '../../dtos/client-type.dto';
import { CreateClientTypeInputDto } from '../../usecases/create-client-type/dtos/create-client-type.dto';
import { EditClientTypeInputDto } from '../../usecases/edit-client-type/dtos/edit-client-type.dto';
import { FindAllClientTypeQueryDto } from '../../usecases/find-all-client-type/dtos/find-all-client-type.dto';

export interface IClientTypeDao {
  findAll(queries: FindAllClientTypeQueryDto): Promise<[ClientTypeDto[], number]>;
  findById(id: number): Promise<ClientTypeDto | null>;
  save(data: CreateClientTypeInputDto): Promise<number>;
  edit(id: number, data: EditClientTypeInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
}
