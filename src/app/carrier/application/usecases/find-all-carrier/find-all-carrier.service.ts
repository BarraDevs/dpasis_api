import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { CarrierDto } from '../../dtos/carrier.dto';
import type { ICarrierDao } from '../../persistence/dao/carrier-dao.interface';
import { FindAllCarrierQueryDto } from './dtos/find-all-carrier.dto';

@Injectable()
export class FindAllCarrier {
  constructor(
    @Inject(TOKENS.CarrierDao) private readonly carrierDao: ICarrierDao,
  ) {}

  public async execute(queries: FindAllCarrierQueryDto): Promise<IPagination<CarrierDto>> {
    const [result, total] = await this.carrierDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
