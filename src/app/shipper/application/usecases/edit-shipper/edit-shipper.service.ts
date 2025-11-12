import { Inject, Injectable } from '@nestjs/common';
import { ShipperDuplicateCnpjError } from 'src/app/shipper/domain/errors/duplicate-cnpj.error';
import { ShipperNotFoundError } from 'src/app/shipper/domain/errors/shipper-not-found';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IShipperDao } from '../../persistence/dao/shipper-dao.interface';
import { EditShipperInputDto } from './dtos/edit-shipper.dto';

@Injectable()
export class EditShipper {
  constructor(
    @Inject(TOKENS.ShipperDao) private readonly shipperDao: IShipperDao,
  ) {}

  public async execute(id: string, data: EditShipperInputDto): Promise<SuccessMessage> {
    const shipper = await this.shipperDao.findById(id);
    if (!shipper) {
      throw new ShipperNotFoundError();
    }

    if (data.cnpj && data.cnpj !== shipper.cnpj) {
      const duplicate = await this.shipperDao.findByCnpj(data.cnpj);
      if (duplicate) {
        throw new ShipperDuplicateCnpjError();
      }
    }

    await this.shipperDao.edit(id, data);

    return { message: 'Transportadora atualizada com sucesso!' };
  }
}
