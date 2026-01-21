import { Service } from 'src/app/service/domain/entities/service.entity';

export interface IServiceRepository {
  findById(id: string): Promise<Service | null>;
  save(service: Service): Promise<void>;
  edit(service: Service): Promise<void>;
}
