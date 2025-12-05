import { Provider } from 'src/app/provider/domain/entities/provider.entity';

export interface IProviderRepository {
  findById(id: string): Promise<Provider | null>;
  save(provider: Provider): Promise<void>;
  edit(provider: Provider): Promise<void>;
}


