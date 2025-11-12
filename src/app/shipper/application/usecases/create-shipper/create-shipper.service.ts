import { Inject, Injectable } from '@nestjs/common';
import { ShipperDuplicateCnpjError } from 'src/app/shipper/domain/errors/duplicate-cnpj.error';
import { TOKENS } from 'src/core/di/token';
import type { IShipperDao } from '../../persistence/dao/shipper-dao.interface';
import { CreateShipperInputDto, CreateShipperOutputDto } from './dtos/create-shipper.dto';

@Injectable()
export class CreateShipper {
  constructor(
    @Inject(TOKENS.ShipperDao) private readonly shipperDao: IShipperDao,
  ) {}

  public async execute(data: CreateShipperInputDto): Promise<CreateShipperOutputDto> {
    const existing = await this.shipperDao.findByCnpj(data.cnpj);
    if (existing) {
      throw new ShipperDuplicateCnpjError();
    }

    const shipperId = await this.shipperDao.save(data);

    return { id: shipperId };
  }
}
