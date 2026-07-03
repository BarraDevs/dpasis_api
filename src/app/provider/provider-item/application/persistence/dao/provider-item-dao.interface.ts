import { ProviderItemDto } from '../../dtos/provider-item.dto';
import { FindAllProviderItemQueryDto } from '../../usecases/find-all-provider-item/dtos/find-all-provider-item.dto';

export interface IProviderItemDao {
  findAll(queries: FindAllProviderItemQueryDto): Promise<[ProviderItemDto[], number]>;
  findById(id: number): Promise<ProviderItemDto | null>;
}
