import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { ClientAddressNotFoundError } from '../../../domain/errors/client-address-not-found.error';
import { ClientAddressDto } from '../../dtos/client-address.dto';
import type { IClientAddressDao } from '../../persistence/dao/client-address-dao.interface';

@Injectable()
export class FindClientAddressById {
  constructor(
    @Inject(TOKENS.ClientAddressDao) private readonly clientAddressDao: IClientAddressDao,
  ) {}

  public async execute(id: number): Promise<ClientAddressDto> {
    const result = await this.clientAddressDao.findById(id);
    if (!result) {
      throw new ClientAddressNotFoundError();
    }

    return result;
  }
}
