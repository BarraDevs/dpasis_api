import { Inject, Injectable } from '@nestjs/common';
import { ProviderNotFoundError } from 'src/app/provider/domain/errors/provider-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { ProviderDto } from '../../dtos/provider.dto';
import type { IProviderDao } from '../../persistence/dao/provider-dao.interface';

@Injectable()
export class FindProviderById {
  constructor(
    @Inject(TOKENS.ProviderDao) private readonly providerDao: IProviderDao,
  ) {}

  public async execute(id: number): Promise<ProviderDto> {
    const provider = await this.providerDao.findById(id);
    if (!provider) {
      throw new ProviderNotFoundError();
    }

    return provider;
  }
}
