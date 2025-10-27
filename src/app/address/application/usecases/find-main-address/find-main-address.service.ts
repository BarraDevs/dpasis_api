import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { AddressDto } from '../../dtos/address.dto';
import type { IAddressDao } from '../../persistence/dao/address-dao.interface';

@Injectable()
export class FindMainAddress {
  constructor(
    @Inject(TOKENS.AddressDao) private readonly addressDao: IAddressDao
  ) {}

  public async execute(id: string): Promise<AddressDto | null> {
    return this.addressDao.findMainAddress(id);
  }
}
