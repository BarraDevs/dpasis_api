import { Inject, Injectable } from '@nestjs/common';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { TOKENS } from 'src/core/di/token';
import { ClientAddressDto } from '../../dtos/client-address.dto';
import type { IClientAddressDao } from '../../persistence/dao/client-address-dao.interface';

@Injectable()
export class FindClientAddressByClientIdAndType {
  constructor(
    @Inject(TOKENS.ClientAddressDao) private readonly clientAddressDao: IClientAddressDao,
  ) {}

  public async execute(clientId: number, type: ClientAddressType): Promise<ClientAddressDto | null> {
    return this.clientAddressDao.findByClientIdAndType(clientId, type);
  }
}
