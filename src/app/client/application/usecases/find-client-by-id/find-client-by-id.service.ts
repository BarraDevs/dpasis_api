import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { ClientDto } from '../../dtos/client.dto';
import type { IClientDao } from '../../persistence/dao/client-dao.interface';

@Injectable()
export class FindClientById {
  constructor(
    @Inject(TOKENS.ClientDao) private clientDao: IClientDao
  ) {}

  public async execute(id: string): Promise<ClientDto | null> {
    return this.clientDao.findById(id);
  }
}
