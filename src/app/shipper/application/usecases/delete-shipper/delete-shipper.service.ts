import { Inject, Injectable } from '@nestjs/common';
import { ShipperNotFoundError } from 'src/app/shipper/domain/errors/shipper-not-found';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IShipperDao } from '../../persistence/dao/shipper-dao.interface';

@Injectable()
export class DeleteShipper {
  constructor(
    @Inject(TOKENS.ShipperDao) private readonly shipperDao: IShipperDao,
  ) {}

  public async execute(id: string): Promise<SuccessMessage> {
    const shipper = await this.shipperDao.findById(id);
    if (!shipper) {
      throw new ShipperNotFoundError();
    }

    await this.shipperDao.delete(id);

    return { message: 'Transportadora deletada com sucesso!' };
  }
}
