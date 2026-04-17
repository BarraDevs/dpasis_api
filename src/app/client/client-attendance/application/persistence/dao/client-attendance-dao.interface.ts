import { ClientAttendanceDto } from '../../dtos/client-attendance.dto';
import { CreateClientAttendanceInputDto } from '../../usecases/create-client-attendance/dtos/create-client-attendance.dto';
import { EditClientAttendanceInputDto } from '../../usecases/edit-client-attendance/dtos/edit-client-attendance.dto';
import { FindAllClientAttendanceQueryDto } from '../../usecases/find-all-client-attendance/dtos/find-all-client-attendance.dto';

export interface IClientAttendanceDao {
  findAll(queries: FindAllClientAttendanceQueryDto): Promise<[ClientAttendanceDto[], number]>;
  findById(id: number): Promise<ClientAttendanceDto | null>;
  findByName(name: string): Promise<ClientAttendanceDto | null>;
  save(data: CreateClientAttendanceInputDto): Promise<number>;
  edit(id: number, data: EditClientAttendanceInputDto): Promise<void>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
}
