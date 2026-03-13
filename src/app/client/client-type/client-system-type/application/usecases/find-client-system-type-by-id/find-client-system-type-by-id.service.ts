import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { ClientSystemTypeNotFoundError } from '../../../domain/errors/client-system-type-not-found.error';
import { ClientSystemTypeDto } from '../../dtos/client-system-type.dto';
import type { IClientSystemTypeDao } from '../../persistence/dao/client-system-type-dao.interface';

@Injectable()
export class FindClientSystemTypeById {
  constructor(
    @Inject(TOKENS.ClientSystemTypeDao) private readonly clientSystemTypeDao: IClientSystemTypeDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<ClientSystemTypeDto> {
    const clientSystemType = await this.clientSystemTypeDao.findById(id);
    if (!clientSystemType) {
      throw new ClientSystemTypeNotFoundError();
    }
    if (options.onlyActive && !clientSystemType.active) {
      throw new ClientSystemTypeNotFoundError();
    }

    return clientSystemType;
  }
}
