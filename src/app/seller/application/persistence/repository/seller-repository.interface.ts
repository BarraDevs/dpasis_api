import { Seller } from 'src/app/seller/domain/entities/seller.entity';

export interface ISellerRepository {
  findById(id: string): Promise<Seller | null>;
  save(seller: Seller, passwordHash: string): Promise<void>;
  edit(seller: Seller): Promise<void>;
}

