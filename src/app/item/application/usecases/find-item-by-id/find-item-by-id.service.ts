import { Inject, Injectable } from '@nestjs/common';
import { ItemNotFoundError } from 'src/app/item/domain/errors/item-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { ItemDto } from '../../dtos/item.dto';
import type { IItemDao } from '../../persistence/dao/item-dao.interface';

@Injectable()
export class FindItemById {
  constructor(
    @Inject(TOKENS.ItemDao) private readonly itemDao: IItemDao
  ) {}

  public async execute(id: string): Promise<ItemDto> {
    const item = await this.itemDao.findById(id);
    if (!item) {
      throw new ItemNotFoundError();
    }

    return item;
  }
}
