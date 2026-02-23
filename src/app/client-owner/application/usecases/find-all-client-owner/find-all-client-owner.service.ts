import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientOwnerDto } from '../../dtos/client-owner.dto';
import type { IClientOwnerDao } from '../../persistence/dao/client-owner-dao.interface';
import { FindAllClientOwnerQueryDto } from './dtos/find-all-client-owner.dto';

@Injectable()
export class FindAllClientOwner {
  constructor(
    @Inject(TOKENS.ClientOwnerDao) private readonly clientOwnerDao: IClientOwnerDao,
  ) {}

  public async execute(queries: FindAllClientOwnerQueryDto): Promise<IPagination<ClientOwnerDto>> {
    const [result, total] = await this.clientOwnerDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
