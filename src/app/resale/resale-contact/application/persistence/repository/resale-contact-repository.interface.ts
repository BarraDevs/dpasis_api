import { ResaleContact } from 'src/app/resale/resale-contact/domain/entities/resale-contact.entity';

export interface IResaleContactRepository {
  save(entity: ResaleContact): Promise<number>;
  edit(entity: ResaleContact): Promise<void>;
  findById(id: number): Promise<ResaleContact | null>;
  delete(id: number): Promise<void>;
}
