import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { ClientItemNotFoundError } from '../../../domain/errors/client-item-not-found.error';
import { ClientItemDto } from '../../dtos/client-item.dto';
import type { IClientItemDao } from '../../persistence/dao/client-item-dao.interface';

@Injectable()
export class FindClientItemById {
  constructor(
    @Inject(TOKENS.ClientItemDao) private readonly clientItemDao: IClientItemDao,
  ) {}

  public async execute(id: number): Promise<ClientItemDto> {
    const result = await this.clientItemDao.findById(id);
    if (!result) {
      throw new ClientItemNotFoundError();
    }
    return result;
  }
}
