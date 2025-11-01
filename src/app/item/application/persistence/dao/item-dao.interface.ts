import { ItemDto } from '../../dtos/item.dto';
import { FindAllItemQueryDto } from '../../usecases/find-all-item/dtos/find-all-item.dto';

export interface IItemDao {
  findAll(queries: FindAllItemQueryDto): Promise<[ItemDto[], number]>;
  findById(id: string): Promise<ItemDto | null>;
}
