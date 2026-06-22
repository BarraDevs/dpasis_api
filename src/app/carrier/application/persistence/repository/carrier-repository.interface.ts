import { Carrier } from '../../../domain/entities/carrier.entity';

export interface ICarrierRepository {
  save(entity: Carrier): Promise<number>;
  edit(entity: Carrier): Promise<void>;
  findById(id: number): Promise<Carrier | null>;
}
