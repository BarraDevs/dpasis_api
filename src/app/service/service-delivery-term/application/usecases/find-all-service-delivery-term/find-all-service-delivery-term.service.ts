import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ServiceDeliveryTermDto } from '../../dtos/service-delivery-term.dto';
import type { IServiceDeliveryTermDao } from '../../persistence/dao/service-delivery-term-dao.interface';
import { FindAllServiceDeliveryTermQueryDto } from './dtos/find-all-service-delivery-term.dto';

@Injectable()
export class FindAllServiceDeliveryTerm {
  constructor(
    @Inject(TOKENS.ServiceDeliveryTermDao) private readonly serviceDeliveryTermDao: IServiceDeliveryTermDao,
  ) {}

  public async execute(queries: FindAllServiceDeliveryTermQueryDto): Promise<IPagination<ServiceDeliveryTermDto>> {
    const [result, total] = await this.serviceDeliveryTermDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
