import { Inject, Injectable } from '@nestjs/common';
import { ProviderItemNotFoundError } from 'src/app/provider/provider-item/domain/errors/provider-item-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { ProviderItemDto } from '../../dtos/provider-item.dto';
import type { IProviderItemDao } from '../../persistence/dao/provider-item-dao.interface';

@Injectable()
export class FindProviderItemById {
  constructor(
    @Inject(TOKENS.ProviderItemDao) private readonly providerItemDao: IProviderItemDao,
  ) {}

  public async execute(id: number): Promise<ProviderItemDto> {
    const item = await this.providerItemDao.findById(id);
    if (!item) {
      throw new ProviderItemNotFoundError();
    }

    return item;
  }
}
