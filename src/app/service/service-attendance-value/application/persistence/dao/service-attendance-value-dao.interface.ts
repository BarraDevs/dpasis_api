import { ServiceAttendanceValueDto } from '../../dtos/service-attendance-value.dto';
import { FindAllServiceAttendanceValueQueryDto } from '../../usecases/find-all-service-attendance-value/dtos/find-all-service-attendance-value.dto';

export interface IServiceAttendanceValueDao {
  findAll(queries: FindAllServiceAttendanceValueQueryDto): Promise<[ServiceAttendanceValueDto[], number]>;
  findById(id: number): Promise<ServiceAttendanceValueDto | null>;
}
