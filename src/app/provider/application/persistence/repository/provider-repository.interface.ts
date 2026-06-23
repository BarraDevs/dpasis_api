import { Provider } from '../../../domain/entities/provider.entity';

export interface IProviderRepository {
  save(entity: Provider): Promise<number>;
  edit(entity: Provider): Promise<void>;
  findById(id: number): Promise<Provider | null>;
  delete(id: number): Promise<void>;
}
