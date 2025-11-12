import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ShipperDto } from '../../dtos/shipper.dto';
import type { IShipperDao } from '../../persistence/dao/shipper-dao.interface';
import { FindAllShipperQueryDto } from './dtos/find-all-shipper.dto';

@Injectable()
export class FindAllShipper {
  constructor(
    @Inject(TOKENS.ShipperDao) private readonly shipperDao: IShipperDao,
  ) {}

  public async execute(queries: FindAllShipperQueryDto): Promise<IPagination<ShipperDto>> {
    const [result, total] = await this.shipperDao.findAll(queries);

    return new Pagination(result, total, queries.page, queries.size).getDto();
  }
}
