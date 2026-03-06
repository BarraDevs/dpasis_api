import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { ClientGroupNotFoundError } from '../../../domain/errors/client-group-not-found.error';
import { ClientGroupDto } from '../../dtos/client-group.dto';
import type { IClientGroupDao } from '../../persistence/dao/client-group-dao.interface';

@Injectable()
export class FindClientGroupById {
  constructor(
    @Inject(TOKENS.ClientGroupDao) private readonly clientGroupDao: IClientGroupDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<ClientGroupDto> {
    const clientGroup = await this.clientGroupDao.findById(id);
    if (!clientGroup) {
      throw new ClientGroupNotFoundError();
    }
    if (options.onlyActive && !clientGroup.active) {
      throw new ClientGroupNotFoundError();
    }

    return clientGroup;
  }
}
