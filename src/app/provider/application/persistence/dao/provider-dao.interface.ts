import { ProviderDto } from '../../dtos/provider.dto';
import { FindAllProviderQueryDto } from '../../usecases/find-all-provider/dtos/find-all-provider.dto';

export interface IProviderDao {
  findAll(queries: FindAllProviderQueryDto): Promise<[ProviderDto[], number]>;
  findById(id: string): Promise<ProviderDto | null>;
  findByCnpj(cnpj: string): Promise<ProviderDto | null>;
}


