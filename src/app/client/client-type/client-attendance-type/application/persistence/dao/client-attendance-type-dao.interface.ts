import { ClientAttendanceTypeDto } from '../../dtos/client-attendance-type.dto';
import { CreateClientAttendanceTypeInputDto } from '../../usecases/create-client-attendance-type/dtos/create-client-attendance-type.dto';
import { EditClientAttendanceTypeInputDto } from '../../usecases/edit-client-attendance-type/dtos/edit-client-attendance-type.dto';
import { FindAllClientAttendanceTypeQueryDto } from '../../usecases/find-all-client-attendance-type/dtos/find-all-client-attendance-type.dto';

export interface IClientAttendanceTypeDao {
  findAll(queries: FindAllClientAttendanceTypeQueryDto): Promise<[ClientAttendanceTypeDto[], number]>;
  findById(id: number): Promise<ClientAttendanceTypeDto | null>;
  findByName(name: string): Promise<ClientAttendanceTypeDto | null>;
  save(data: CreateClientAttendanceTypeInputDto): Promise<number>;
  edit(id: number, data: EditClientAttendanceTypeInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
}
