import { Resale } from 'src/app/resale/resale/domain/entities/resale.entity';

export interface IResaleRepository {
  save(entity: Resale): Promise<number>;
  edit(entity: Resale): Promise<void>;
  findById(id: number): Promise<Resale | null>;
  delete(id: number): Promise<void>;
}
