import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ServiceFreightDto } from '../../dtos/service-freight.dto';
import type { IServiceFreightDao } from '../../persistence/dao/service-freight-dao.interface';
import { FindAllServiceFreightQueryDto } from './dtos/find-all-service-freight.dto';

@Injectable()
export class FindAllServiceFreight {
  constructor(
    @Inject(TOKENS.ServiceFreightDao) private readonly serviceFreightDao: IServiceFreightDao,
  ) {}

  public async execute(queries: FindAllServiceFreightQueryDto): Promise<IPagination<ServiceFreightDto>> {
    const [result, total] = await this.serviceFreightDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
