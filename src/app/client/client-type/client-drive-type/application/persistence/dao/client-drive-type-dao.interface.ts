import { ClientDriveTypeDto } from '../../dtos/client-drive-type.dto';
import { CreateClientDriveTypeInputDto } from '../../usecases/create-client-drive-type/dtos/create-client-drive-type.dto';
import { EditClientDriveTypeInputDto } from '../../usecases/edit-client-drive-type/dtos/edit-client-drive-type.dto';
import { FindAllClientDriveTypeQueryDto } from '../../usecases/find-all-client-drive-type/dtos/find-all-client-drive-type.dto';

export interface IClientDriveTypeDao {
  findAll(queries: FindAllClientDriveTypeQueryDto): Promise<[ClientDriveTypeDto[], number]>;
  findById(id: number): Promise<ClientDriveTypeDto | null>;
  findByName(name: string): Promise<ClientDriveTypeDto | null>;
  save(data: CreateClientDriveTypeInputDto): Promise<number>;
  edit(id: number, data: EditClientDriveTypeInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
  countClientTypesByDriveTypeId(driveTypeId: number): Promise<number>;
}
