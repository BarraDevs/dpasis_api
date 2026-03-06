import { ClientDiscountDto } from '../../dtos/client-discount.dto';
import { FindAllClientDiscountQueryDto } from '../../usecases/find-all-client-discount/dtos/find-all-client-discount.dto';

export interface IClientDiscountDao {
  findAll(queries: FindAllClientDiscountQueryDto): Promise<[ClientDiscountDto[], number]>;
  findById(id: number): Promise<ClientDiscountDto | null>;
}
