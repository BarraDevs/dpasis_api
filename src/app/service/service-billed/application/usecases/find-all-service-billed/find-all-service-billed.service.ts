import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ServiceBilledDto } from '../../dtos/service-billed.dto';
import type { IServiceBilledDao } from '../../persistence/dao/service-billed-dao.interface';
import { FindAllServiceBilledQueryDto } from './dtos/find-all-service-billed.dto';

@Injectable()
export class FindAllServiceBilled {
  constructor(
    @Inject(TOKENS.ServiceBilledDao) private readonly serviceBilledDao: IServiceBilledDao,
  ) {}

  public async execute(queries: FindAllServiceBilledQueryDto): Promise<IPagination<ServiceBilledDto>> {
    const [result, total] = await this.serviceBilledDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
