import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { ClientTypeNotFoundError } from '../../../domain/errors/client-type-not-found.error';
import { ClientTypeDto } from '../../dtos/client-type.dto';
import type { IClientTypeDao } from '../../persistence/dao/client-type-dao.interface';

@Injectable()
export class FindClientTypeById {
  constructor(
    @Inject(TOKENS.ClientTypeDao) private readonly clientTypeDao: IClientTypeDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<ClientTypeDto> {
    const clientType = await this.clientTypeDao.findById(id);
    if (!clientType) {
      throw new ClientTypeNotFoundError();
    }
    if (options.onlyActive && !clientType.active) {
      throw new ClientTypeNotFoundError();
    }

    return clientType;
  }
}
