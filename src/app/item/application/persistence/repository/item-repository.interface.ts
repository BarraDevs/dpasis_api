import { Item } from 'src/app/item/domain/entities/item.entity';

export interface IItemRepository {
  createMany(items: Item[]): Promise<void>;
  edit(item: Item): Promise<void>;
  delete(id: string): Promise<void>;
}
