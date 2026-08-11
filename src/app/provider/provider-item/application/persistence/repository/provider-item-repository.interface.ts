import { ProviderItem } from '../../../domain/entities/provider-item.entity';

export interface IProviderItemRepository {
  save(entity: ProviderItem): Promise<number>;
  edit(entity: ProviderItem): Promise<void>;
  updateStatus(id: number, active: boolean): Promise<void>;
  findById(id: number): Promise<ProviderItem | null>;
  delete(id: number): Promise<void>;
}
