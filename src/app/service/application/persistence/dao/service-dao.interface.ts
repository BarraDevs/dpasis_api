import { ServiceDto } from '../../dtos/service.dto';
import { FindAllServiceQueryDto } from '../../usecases/find-all-service/dtos/find-all-service.dto';

export interface IServiceDao {
  findAll(queries: FindAllServiceQueryDto): Promise<[ServiceDto[], number]>;
  findById(id: string): Promise<ServiceDto | null>;
}
