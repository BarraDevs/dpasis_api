import { Seller } from 'src/app/seller/domain/entities/seller.entity';

export interface ISellerRepository {
  save(entity: Seller): Promise<number>;
  edit(entity: Seller): Promise<void>;
  findById(id: number): Promise<Seller | null>;
  delete(id: number): Promise<void>;
}
