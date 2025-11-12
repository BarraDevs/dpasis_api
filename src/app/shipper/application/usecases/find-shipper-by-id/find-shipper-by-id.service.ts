import { Inject, Injectable } from '@nestjs/common';
import { ShipperNotFoundError } from 'src/app/shipper/domain/errors/shipper-not-found';
import { TOKENS } from 'src/core/di/token';
import { ShipperDto } from '../../dtos/shipper.dto';
import type { IShipperDao } from '../../persistence/dao/shipper-dao.interface';

@Injectable()
export class FindShipperById {
  constructor(
    @Inject(TOKENS.ShipperDao) private readonly shipperDao: IShipperDao,
  ) {}

  public async execute(id: string): Promise<ShipperDto> {
    const shipper = await this.shipperDao.findById(id);
    if (!shipper) {
      throw new ShipperNotFoundError();
    }

    return shipper;
  }
}
