import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ProviderItemDto } from '../../dtos/provider-item.dto';
import type { IProviderItemDao } from '../../persistence/dao/provider-item-dao.interface';
import { FindAllProviderItemQueryDto } from './dtos/find-all-provider-item.dto';

@Injectable()
export class FindAllProviderItem {
  constructor(
    @Inject(TOKENS.ProviderItemDao) private readonly providerItemDao: IProviderItemDao,
  ) {}

  public async execute(queries: FindAllProviderItemQueryDto) {
    const [rows, total] = await this.providerItemDao.findAll(queries);

    return new Pagination<ProviderItemDto>(rows, total, queries.page, queries.size).getDto();
  }
}
