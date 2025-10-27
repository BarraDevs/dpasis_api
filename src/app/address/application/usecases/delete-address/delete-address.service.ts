import { Inject, Injectable } from '@nestjs/common';
import { AddressMainCannotBeDeletedError } from 'src/app/address/domain/errors/address-main-cannot-be-deleted.error';
import { AddressNotFoundError } from 'src/app/address/domain/errors/address-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IAddressDao } from '../../persistence/dao/address-dao.interface';

@Injectable()
export class DeleteAddress {
  constructor(
    @Inject(TOKENS.AddressDao) private addressDao: IAddressDao
  ) {}

  public async execute(id: string): Promise<SuccessMessage> {
    const address = await this.addressDao.findById(id, false);
    if (!address) {
      throw new AddressNotFoundError();
    }
    if (address.isMain) {
      throw new AddressMainCannotBeDeletedError();
    }

    await this.addressDao.delete(id);

    return { message: 'Endereço deletado com sucesso!' };
  }
}
