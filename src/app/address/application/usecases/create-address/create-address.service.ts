import { Inject, Injectable } from '@nestjs/common';
import { AddressMainMustBeOneError } from 'src/app/address/domain/errors/address-main-must-be-one.error';
import { FindOwnerById } from 'src/app/owner/application/usecases/find-owner-by-id/find-owner-by-id.service';
import { TOKENS } from 'src/core/di/token';
import type { IAddressDao } from '../../persistence/dao/address-dao.interface';
import { CreateAddressInputDto, CreateAddressOutputDto } from './dtos/create-address.dto';

@Injectable()
export class CreateAddress {
  constructor(
    @Inject(TOKENS.AddressDao) private readonly addressDao: IAddressDao,
    private readonly findOwnerById: FindOwnerById,
  ) {}

  public async execute(data: CreateAddressInputDto, isMain: boolean): Promise<CreateAddressOutputDto> {
    // Validate owner existence
    const owner = await this.findOwnerById.execute(data.ownerId);

    // Validate main address constraint
    const existingMainAddress = await this.addressDao.findMainAddress(owner.id);
    if (isMain && existingMainAddress) {
      throw new AddressMainMustBeOneError();
    }

    const createdAddressId = await this.addressDao.save(data, isMain);

    return { id: createdAddressId };
  }
}
