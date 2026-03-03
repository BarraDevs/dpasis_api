import { ClientItem } from 'src/app/client/client-item/domain/entities/client-item.entity';

export interface IClientItemRepository {
  save(entity: ClientItem): Promise<number>;
  edit(entity: ClientItem): Promise<void>;
  findById(id: number): Promise<ClientItem | null>;
  delete(id: number): Promise<void>;
}
