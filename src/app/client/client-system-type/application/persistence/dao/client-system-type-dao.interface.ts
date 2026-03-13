import { ClientSystemTypeDto } from '../../dtos/client-system-type.dto';
import { CreateClientSystemTypeInputDto } from '../../usecases/create-client-system-type/dtos/create-client-system-type.dto';
import { EditClientSystemTypeInputDto } from '../../usecases/edit-client-system-type/dtos/edit-client-system-type.dto';
import { FindAllClientSystemTypeQueryDto } from '../../usecases/find-all-client-system-type/dtos/find-all-client-system-type.dto';

export interface IClientSystemTypeDao {
  findAll(queries: FindAllClientSystemTypeQueryDto): Promise<[ClientSystemTypeDto[], number]>;
  findById(id: number): Promise<ClientSystemTypeDto | null>;
  findByName(name: string): Promise<ClientSystemTypeDto | null>;
  save(data: CreateClientSystemTypeInputDto): Promise<number>;
  edit(id: number, data: EditClientSystemTypeInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
}
