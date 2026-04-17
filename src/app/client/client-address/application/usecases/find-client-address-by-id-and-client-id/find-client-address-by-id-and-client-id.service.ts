import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { ClientAddressNotFoundError } from '../../../domain/errors/client-address-not-found.error';
import { ClientAddressDto } from '../../dtos/client-address.dto';
import type { IClientAddressDao } from '../../persistence/dao/client-address-dao.interface';

@Injectable()
export class FindClientAddressByIdAndClientId {
  constructor(
    @Inject(TOKENS.ClientAddressDao) private readonly clientAddressDao: IClientAddressDao,
  ) {}

  public async execute(id: number, clientId: number, options: FindByIdOptions = {}): Promise<ClientAddressDto> {
    const result = await this.clientAddressDao.findById(id);
    if (!result) {
      throw new ClientAddressNotFoundError();
    }
    if (result.clientId !== clientId) {
      throw new ClientAddressNotFoundError();
    }
    if (options.onlyActive && !result.active) {
      throw new ClientAddressNotFoundError();
    }

    return result;
  }
}
