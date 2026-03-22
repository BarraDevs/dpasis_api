import { ServiceBilled } from 'src/app/service/service-billed/domain/entities/service-billed.entity';

export interface IServiceBilledRepository {
  save(entity: ServiceBilled): Promise<number>;
  edit(entity: ServiceBilled): Promise<void>;
  findById(id: number): Promise<ServiceBilled | null>;
  delete(id: number): Promise<void>;
}
