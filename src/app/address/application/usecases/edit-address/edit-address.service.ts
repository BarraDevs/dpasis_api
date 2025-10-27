import { Inject, Injectable } from '@nestjs/common';
import { AddressNotFoundError } from 'src/app/address/domain/errors/address-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IAddressDao } from '../../persistence/dao/address-dao.interface';
import { EditAddressInputDto } from './dtos/edit-address.dto';

@Injectable()
export class EditAddress {
  constructor(
    @Inject(TOKENS.AddressDao) private readonly addressDao: IAddressDao
  ) {}

  public async execute(id: string, isMain: boolean, data: EditAddressInputDto): Promise<SuccessMessage> {
    const address = await this.addressDao.findById(id, isMain);
    if (!address) {
      throw new AddressNotFoundError();
    }

    await this.addressDao.edit(address.id, data);

    return { message: 'Endereço atualizado com sucesso!' };
  }
}
