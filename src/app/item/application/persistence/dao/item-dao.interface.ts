import { ItemDto } from '../../dtos/item.dto';
import { CreateItemInputDto } from '../../usecases/create-item/dtos/create-item.dto';
import { EditItemInputDto } from '../../usecases/edit-item/dtos/edit-item.dto';
import { FindAllItemQueryDto } from '../../usecases/find-all-item/dtos/find-all-item.dto';

export interface IItemDao {
  findAll(queries: FindAllItemQueryDto): Promise<[ItemDto[], number]>;
  findById(id: string): Promise<ItemDto | null>;
  save(data: CreateItemInputDto): Promise<string>;
  edit(id: string, data: EditItemInputDto): Promise<void>;
  delete(id: string): Promise<void>;
}
