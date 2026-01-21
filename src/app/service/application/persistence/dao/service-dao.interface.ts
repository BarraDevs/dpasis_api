import { ServiceDto } from '../../dtos/service.dto';

export interface IServiceDao {
  findById(id: string): Promise<ServiceDto | null>;
}
