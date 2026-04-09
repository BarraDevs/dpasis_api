import { BilledDto } from '../../dtos/billed.dto';
import { FindAllBilledQueryDto } from '../../usecases/find-all-billed/dtos/find-all-billed.dto';

export interface IBilledDao {
  findAll(queries: FindAllBilledQueryDto): Promise<[BilledDto[], number]>;
  findById(id: number): Promise<BilledDto | null>;
  countServicesByBilledId(billedId: number): Promise<number>;
}
