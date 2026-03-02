import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { ClientOwnerNotFoundError } from '../../../domain/errors/client-owner-not-found.error';
import { ClientOwnerDto } from '../../dtos/client-owner.dto';
import type { IClientOwnerDao } from '../../persistence/dao/client-owner-dao.interface';

@Injectable()
export class FindClientOwnerById {
  constructor(
    @Inject(TOKENS.ClientOwnerDao) private readonly clientOwnerDao: IClientOwnerDao,
  ) {}

  public async execute(id: number, onlyActive: boolean = false): Promise<ClientOwnerDto> {
    const clientOwner = await this.clientOwnerDao.findById(id);
    if (!clientOwner) {
      throw new ClientOwnerNotFoundError();
    }
    if (onlyActive && !clientOwner.active) {
      throw new ClientOwnerNotFoundError();
    }

    return clientOwner;
  }
}
