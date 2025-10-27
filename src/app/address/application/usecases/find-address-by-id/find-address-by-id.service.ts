import { Inject, Injectable } from '@nestjs/common';
import { AddressNotFoundError } from 'src/app/address/domain/errors/address-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { AddressDto } from '../../dtos/address.dto';
import type { IAddressDao } from '../../persistence/dao/address-dao.interface';

@Injectable()
export class FindAddressById {
  constructor(
    @Inject(TOKENS.AddressDao) private readonly addressDao: IAddressDao
  ) {}

  public async execute(id: string, isMain: boolean): Promise<AddressDto> {
    const address = await this.addressDao.findById(id, isMain);
    if (!address) {
      throw new AddressNotFoundError();
    }

    return address;
  }
}
