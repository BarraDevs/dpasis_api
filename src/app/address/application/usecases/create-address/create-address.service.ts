import { Inject, Injectable } from '@nestjs/common';
import { AddressMainMustBeOneError } from 'src/app/address/domain/errors/address-main-must-be-one.error';
import { FindOwnerById } from 'src/app/owner/application/usecases/find-owner-by-id/find-owner-by-id.service';
import { OwnerNotActiveError } from 'src/app/owner/domain/errors/owner-not-active.error';
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
    const owner = await this.findOwnerById.execute(data.ownerId);
    if (!owner.active) {
      throw new OwnerNotActiveError();
    }

    if (isMain) {
      const existingMainAddress = await this.addressDao.findMainAddress(owner.id);
      if (existingMainAddress) {
        throw new AddressMainMustBeOneError();
      }
    }

    return { id: await this.addressDao.save(data, isMain) };
  }
}
