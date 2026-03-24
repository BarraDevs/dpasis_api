import { ServiceAttendanceValue } from 'src/app/service/service-attendance-value/domain/entities/service-attendance-value.entity';

export interface IServiceAttendanceValueRepository {
  save(entity: ServiceAttendanceValue): Promise<number>;
  edit(entity: ServiceAttendanceValue): Promise<void>;
  findById(id: number): Promise<ServiceAttendanceValue | null>;
  delete(id: number): Promise<void>;
}
