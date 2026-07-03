import { ProviderItem } from '../../../domain/entities/provider-item.entity';
import { ProviderItemInstallmentStatus } from '../../../domain/enums/provider-item-installment-status.enum';

export interface IProviderItemRepository {
  save(entity: ProviderItem): Promise<number>;
  edit(entity: ProviderItem): Promise<void>;
  updateActive(id: number, active: boolean): Promise<void>;
  findById(id: number): Promise<ProviderItem | null>;
  delete(id: number): Promise<void>;
  payInstallment(providerItemId: number, installmentId: number): Promise<void>;
  findInstallmentById(providerItemId: number, installmentId: number): Promise<{ id: number; status: ProviderItemInstallmentStatus } | null>;
}
