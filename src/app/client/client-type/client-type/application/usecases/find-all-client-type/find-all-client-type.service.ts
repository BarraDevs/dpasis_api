import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientTypeDto } from '../../dtos/client-type.dto';
import type { IClientTypeDao } from '../../persistence/dao/client-type-dao.interface';
import { FindAllClientTypeQueryDto } from './dtos/find-all-client-type.dto';

@Injectable()
export class FindAllClientType {
  constructor(
    @Inject(TOKENS.ClientTypeDao) private readonly clientTypeDao: IClientTypeDao,
  ) {}

  public async execute(queries: FindAllClientTypeQueryDto): Promise<IPagination<ClientTypeDto>> {
    const [result, total] = await this.clientTypeDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
