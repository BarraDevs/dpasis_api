import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientGroupDto } from '../../dtos/client-group.dto';
import type { IClientGroupDao } from '../../persistence/dao/client-group-dao.interface';
import { FindAllClientGroupQueryDto } from './dtos/find-all-client-group.dto';

@Injectable()
export class FindAllClientGroup {
  constructor(
    @Inject(TOKENS.ClientGroupDao) private readonly clientGroupDao: IClientGroupDao,
  ) {}

  public async execute(queries: FindAllClientGroupQueryDto): Promise<IPagination<ClientGroupDto>> {
    const [result, total] = await this.clientGroupDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
