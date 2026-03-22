import { ServiceBilledDto } from '../../dtos/service-billed.dto';
import { FindAllServiceBilledQueryDto } from '../../usecases/find-all-service-billed/dtos/find-all-service-billed.dto';

export interface IServiceBilledDao {
  findAll(queries: FindAllServiceBilledQueryDto): Promise<[ServiceBilledDto[], number]>;
  findById(id: number): Promise<ServiceBilledDto | null>;
}
