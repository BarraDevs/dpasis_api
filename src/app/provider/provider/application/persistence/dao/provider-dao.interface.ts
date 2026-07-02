import { ProviderDto } from '../../dtos/provider.dto';
import { FindAllProviderQueryDto } from '../../usecases/find-all-provider/dtos/find-all-provider.dto';

export interface IProviderDao {
  findAll(queries: FindAllProviderQueryDto): Promise<[ProviderDto[], number]>;
  findById(id: number): Promise<ProviderDto | null>;
  findByDocument(document: string): Promise<ProviderDto | null>;
  findByEmail(email: string): Promise<ProviderDto | null>;
}
