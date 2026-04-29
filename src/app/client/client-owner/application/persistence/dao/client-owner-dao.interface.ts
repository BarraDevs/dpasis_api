import { ClientOwnerDto } from '../../dtos/client-owner.dto';
import { CreateClientOwnerInputDto } from '../../usecases/create-client-owner/dtos/create-client-owner.dto';
import { EditClientOwnerInputDto } from '../../usecases/edit-client-owner/dtos/edit-client-owner.dto';
import { FindAllClientOwnerQueryDto } from '../../usecases/find-all-client-owner/dtos/find-all-client-owner.dto';

export interface IClientOwnerDao {
  findAll(queries: FindAllClientOwnerQueryDto): Promise<[ClientOwnerDto[], number]>;
  findById(id: number): Promise<ClientOwnerDto | null>;
  findByName(name: string): Promise<ClientOwnerDto | null>;
  save(data: CreateClientOwnerInputDto): Promise<number>;
  edit(id: number, data: EditClientOwnerInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
}
