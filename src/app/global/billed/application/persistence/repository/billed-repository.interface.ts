import { Billed } from 'src/app/global/billed/domain/entities/billed.entity';

export interface IBilledRepository {
  save(entity: Billed): Promise<number>;
  edit(entity: Billed): Promise<void>;
  findById(id: number): Promise<Billed | null>;
  delete(id: number): Promise<void>;
}
