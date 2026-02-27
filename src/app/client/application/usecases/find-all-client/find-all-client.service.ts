import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientDto } from '../../dtos/client.dto';
import type { IClientDao } from '../../persistence/dao/client-dao.interface';
import { FindAllClientQueryDto } from './dtos/find-all-client.dto';

@Injectable()
export class FindAllClient {
  constructor(
    @Inject(TOKENS.ClientDao) private readonly clientDao: IClientDao,
  ) {}

  public async execute(queries: FindAllClientQueryDto): Promise<IPagination<ClientDto>> {
    const [result, total] = await this.clientDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
