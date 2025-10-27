import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { AddressDto } from '../../dtos/address.dto';
import type { IAddressDao } from '../../persistence/dao/address-dao.interface';
import { FindAllAddressQueryDto } from './dtos/find-all-address.dto';

@Injectable()
export class FindAllAddress {
  constructor(
    @Inject(TOKENS.AddressDao) private readonly addressDao: IAddressDao,
  ) {}

  public async execute(queries: FindAllAddressQueryDto): Promise<IPagination<AddressDto>> {
    const [result, total] = await this.addressDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
