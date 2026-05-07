import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientDto } from '../../dtos/client.dto';
import type { IClientDao } from '../../persistence/dao/client-dao.interface';
import { SearchClientInputDto } from './dtos/search-client.dto';

@Injectable()
export class SearchClient {
  constructor(
    @Inject(TOKENS.ClientDao) private readonly clientDao: IClientDao,
  ) {}

  public async execute(input: SearchClientInputDto): Promise<IPagination<ClientDto>> {
    const [result, total] = await this.clientDao.search(input);

    return new Pagination(result, total, input.page, input.size).getDto();
  }
}
