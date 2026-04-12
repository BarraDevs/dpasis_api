import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientNotFoundError } from '../../../domain/errors/client-not-found.error';
import { ClientDto } from '../../dtos/client.dto';
import type { IClientDao } from '../../persistence/dao/client-dao.interface';
import { FindSubClientsQueryDto } from './dtos/find-sub-clients.dto';

@Injectable()
export class FindSubClients {
  constructor(
    @Inject(TOKENS.ClientDao) private readonly clientDao: IClientDao,
  ) {}

  public async execute(clientId: number, queries: FindSubClientsQueryDto): Promise<IPagination<ClientDto>> {
    const client = await this.clientDao.findById(clientId);
    if (!client) {
      throw new ClientNotFoundError();
    }

    const [result, total] = await this.clientDao.findSubClients(clientId, queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
