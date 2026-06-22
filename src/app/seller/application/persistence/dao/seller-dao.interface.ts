import { SellerDto } from '../../dtos/seller.dto';
import { FindAllSellerQueryDto } from '../../usecases/find-all-seller/dtos/find-all-seller.dto';

export interface ISellerDao {
  findAll(queries: FindAllSellerQueryDto): Promise<[SellerDto[], number]>;
  findById(id: number): Promise<SellerDto | null>;
  findByEmail(email: string): Promise<{ id: number } | null>;
}
