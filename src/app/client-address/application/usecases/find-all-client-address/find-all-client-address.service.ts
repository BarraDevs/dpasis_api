import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientAddressDto } from '../../dtos/client-address.dto';
import type { IClientAddressDao } from '../../persistence/dao/client-address-dao.interface';
import { FindAllClientAddressQueryDto } from './dtos/find-all-client-address.dto';

@Injectable()
export class FindAllClientAddress {
  constructor(
    @Inject(TOKENS.ClientAddressDao) private readonly clientAddressDao: IClientAddressDao,
  ) {}

  public async execute(queries: FindAllClientAddressQueryDto): Promise<IPagination<ClientAddressDto>> {
    const [result, total] = await this.clientAddressDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
