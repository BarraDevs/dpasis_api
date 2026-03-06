import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { ClientNotFoundError } from '../../../domain/errors/client-not-found.error';
import { ClientDto } from '../../dtos/client.dto';
import type { IClientDao } from '../../persistence/dao/client-dao.interface';

@Injectable()
export class FindClientById {
  constructor(
    @Inject(TOKENS.ClientDao) private readonly clientDao: IClientDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<ClientDto> {
    const result = await this.clientDao.findById(id);
    if (!result) {
      throw new ClientNotFoundError();
    }
    if (options.onlyActive && !result.active) {
      throw new ClientNotFoundError();
    }

    return result;
  }
}
