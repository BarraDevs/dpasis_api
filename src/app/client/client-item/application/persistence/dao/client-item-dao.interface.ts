import { ClientItemDto } from '../../dtos/client-item.dto';
import { FindAllClientItemQueryDto } from '../../usecases/find-all-client-item/dtos/find-all-client-item.dto';

export interface IClientItemDao {
  findAll(queries: FindAllClientItemQueryDto): Promise<[ClientItemDto[], number]>;
  findById(id: number): Promise<ClientItemDto | null>;
}
