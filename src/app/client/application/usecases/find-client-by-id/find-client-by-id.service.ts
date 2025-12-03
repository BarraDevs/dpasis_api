import { Inject, Injectable } from '@nestjs/common';
import { ClientNotFoundError } from 'src/app/client/domain/errors/client-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { ClientDto } from '../../dtos/client.dto';
import type { IClientDao } from '../../persistence/dao/client-dao.interface';

@Injectable()
export class FindClientById {
  constructor(
    @Inject(TOKENS.ClientDao) private readonly clientDao: IClientDao
  ) {}

  public async execute(id: string): Promise<ClientDto> {
    const client = await this.clientDao.findById(id);
    if (!client) {
      throw new ClientNotFoundError();
    }

    return client;
  }
}
