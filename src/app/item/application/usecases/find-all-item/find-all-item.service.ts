import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ItemDto } from '../../dtos/item.dto';
import type { IItemDao } from '../../persistence/dao/item-dao.interface';
import { FindAllItemQueryDto } from './dtos/find-all-item.dto';

@Injectable()
export class FindAllItem {
  constructor(
    @Inject(TOKENS.ItemDao) private readonly itemDao: IItemDao,
  ) {}

  public async execute(queries: FindAllItemQueryDto): Promise<IPagination<ItemDto>> {
    const [result, total] = await this.itemDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
