import { Inject, Injectable } from '@nestjs/common';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientItemDto } from '../../dtos/client-item.dto';
import type { IClientItemDao } from '../../persistence/dao/client-item-dao.interface';
import { FindAllClientItemQueryDto } from './dtos/find-all-client-item.dto';
import { TOKENS } from 'src/core/di/token';

@Injectable()
export class FindAllClientItem {
  constructor(
    @Inject(TOKENS.ClientItemDao) private readonly clientItemDao: IClientItemDao,
  ) {}

  public async execute(queries: FindAllClientItemQueryDto): Promise<IPagination<ClientItemDto>> {
    const [result, total] = await this.clientItemDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
