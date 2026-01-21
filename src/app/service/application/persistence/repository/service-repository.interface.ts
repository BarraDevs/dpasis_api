import { Service } from 'src/app/service/domain/entities/service.entity';

export interface IServiceRepository {
  save(service: Service): Promise<void>;
}
