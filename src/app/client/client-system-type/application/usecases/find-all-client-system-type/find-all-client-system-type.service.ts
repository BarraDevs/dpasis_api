import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientSystemTypeDto } from '../../dtos/client-system-type.dto';
import type { IClientSystemTypeDao } from '../../persistence/dao/client-system-type-dao.interface';
import { FindAllClientSystemTypeQueryDto } from './dtos/find-all-client-system-type.dto';

@Injectable()
export class FindAllClientSystemType {
  constructor(
    @Inject(TOKENS.ClientSystemTypeDao) private readonly clientSystemTypeDao: IClientSystemTypeDao,
  ) {}

  public async execute(queries: FindAllClientSystemTypeQueryDto): Promise<IPagination<ClientSystemTypeDto>> {
    const [result, total] = await this.clientSystemTypeDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
