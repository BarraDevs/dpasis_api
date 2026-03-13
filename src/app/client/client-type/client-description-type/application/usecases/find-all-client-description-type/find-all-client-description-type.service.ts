import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ClientDescriptionTypeDto } from '../../dtos/client-description-type.dto';
import type { IClientDescriptionTypeDao } from '../../persistence/dao/client-description-type-dao.interface';
import { FindAllClientDescriptionTypeQueryDto } from './dtos/find-all-client-description-type.dto';

@Injectable()
export class FindAllClientDescriptionType {
  constructor(
    @Inject(TOKENS.ClientDescriptionTypeDao) private readonly clientDescriptionTypeDao: IClientDescriptionTypeDao,
  ) {}

  public async execute(queries: FindAllClientDescriptionTypeQueryDto): Promise<IPagination<ClientDescriptionTypeDto>> {
    const [result, total] = await this.clientDescriptionTypeDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
