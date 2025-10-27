import { Inject, Injectable } from '@nestjs/common';
import { AddressMainMustBeOneError } from 'src/app/address/domain/errors/address-main-must-be-one.error';
import { TOKENS } from 'src/core/di/token';
import type { IAddressDao } from '../../persistence/dao/address-dao.interface';
import { CreateAddressInputDto, CreateAddressOutputDto } from './dtos/create-address.dto';

@Injectable()
export class CreateAddress {
  constructor(
    @Inject(TOKENS.AddressDao) private readonly addressDao: IAddressDao
  ) {}

  public async execute(data: CreateAddressInputDto, isMain: boolean): Promise<CreateAddressOutputDto> {
    const existingMainAddress = await this.addressDao.findMainAddress(data.ownerId);
    if (isMain && existingMainAddress) {
      throw new AddressMainMustBeOneError();
    }

    const createdAddressId = await this.addressDao.save(data, isMain);

    return { id: createdAddressId };
  }
}
