import { ResaleDto } from '../../dtos/resale.dto';
import { FindAllResaleQueryDto } from '../../usecases/find-all-resale/dtos/find-all-resale.dto';

export interface IResaleDao {
  findAll(queries: FindAllResaleQueryDto): Promise<[ResaleDto[], number]>;
  findById(id: number): Promise<ResaleDto | null>;
  findByDocument(document: string): Promise<ResaleDto | null>;
  findMaxId(): Promise<number>;
}
