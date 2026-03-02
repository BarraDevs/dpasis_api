import { ClientDepartmentDto } from '../../dtos/client-department.dto';
import { CreateClientDepartmentInputDto } from '../../usecases/create-client-department/dtos/create-client-department.dto';
import { EditClientDepartmentInputDto } from '../../usecases/edit-client-department/dtos/edit-client-department.dto';
import { FindAllClientDepartmentQueryDto } from '../../usecases/find-all-client-department/dtos/find-all-client-department.dto';

export interface IClientDepartmentDao {
  findAll(queries: FindAllClientDepartmentQueryDto): Promise<[ClientDepartmentDto[], number]>;
  findById(id: number): Promise<ClientDepartmentDto | null>;
  findByName(name: string): Promise<ClientDepartmentDto | null>;
  save(data: CreateClientDepartmentInputDto): Promise<number>;
  edit(id: number, data: EditClientDepartmentInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
}
