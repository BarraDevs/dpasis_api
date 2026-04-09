import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { DeliveryTermDto } from '../../dtos/delivery-term.dto';
import type { IDeliveryTermDao } from '../../persistence/dao/delivery-term-dao.interface';
import { FindAllDeliveryTermQueryDto } from './dtos/find-all-delivery-term.dto';

@Injectable()
export class FindAllDeliveryTerm {
  constructor(
    @Inject(TOKENS.DeliveryTermDao) private readonly deliveryTermDao: IDeliveryTermDao,
  ) {}

  public async execute(queries: FindAllDeliveryTermQueryDto): Promise<IPagination<DeliveryTermDto>> {
    const [result, total] = await this.deliveryTermDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
