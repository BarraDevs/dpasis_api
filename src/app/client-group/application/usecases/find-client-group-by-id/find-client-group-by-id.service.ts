import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { ClientGroupNotFoundError } from '../../../domain/errors/client-group-not-found.error';
import { ClientGroupDto } from '../../dtos/client-group.dto';
import type { IClientGroupDao } from '../../persistence/dao/client-group-dao.interface';

@Injectable()
export class FindClientGroupById {
  constructor(
    @Inject(TOKENS.ClientGroupDao) private readonly clientGroupDao: IClientGroupDao,
  ) {}

  public async execute(id: number): Promise<ClientGroupDto> {
    const clientGroup = await this.clientGroupDao.findById(id);
    if (!clientGroup) {
      throw new ClientGroupNotFoundError();
    }

    return clientGroup;
  }
}
