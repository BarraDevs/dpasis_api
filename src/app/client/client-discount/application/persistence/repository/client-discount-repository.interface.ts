import { ClientDiscount } from 'src/app/client/client-discount/domain/entities/client-discount.entity';

export interface IClientDiscountRepository {
  save(entity: ClientDiscount): Promise<number>;
  edit(entity: ClientDiscount): Promise<void>;
  findById(id: number): Promise<ClientDiscount | null>;
  delete(id: number): Promise<void>;
}
