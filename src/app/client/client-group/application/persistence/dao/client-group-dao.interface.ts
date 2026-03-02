import { ClientGroupDto } from '../../dtos/client-group.dto';
import { CreateClientGroupInputDto } from '../../usecases/create-client-group/dtos/create-client-group.dto';
import { EditClientGroupInputDto } from '../../usecases/edit-client-group/dtos/edit-client-group.dto';
import { FindAllClientGroupQueryDto } from '../../usecases/find-all-client-group/dtos/find-all-client-group.dto';

export interface IClientGroupDao {
  findAll(queries: FindAllClientGroupQueryDto): Promise<[ClientGroupDto[], number]>;
  findById(id: number): Promise<ClientGroupDto | null>;
  findByName(name: string): Promise<ClientGroupDto | null>;
  save(data: CreateClientGroupInputDto): Promise<number>;
  edit(id: number, data: EditClientGroupInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
}
