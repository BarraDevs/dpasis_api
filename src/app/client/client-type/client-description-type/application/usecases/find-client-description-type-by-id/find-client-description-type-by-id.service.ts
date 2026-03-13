import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { ClientDescriptionTypeNotFoundError } from '../../../domain/errors/client-description-type-not-found.error';
import { ClientDescriptionTypeDto } from '../../dtos/client-description-type.dto';
import type { IClientDescriptionTypeDao } from '../../persistence/dao/client-description-type-dao.interface';

@Injectable()
export class FindClientDescriptionTypeById {
  constructor(
    @Inject(TOKENS.ClientDescriptionTypeDao) private readonly clientDescriptionTypeDao: IClientDescriptionTypeDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<ClientDescriptionTypeDto> {
    const clientDescriptionType = await this.clientDescriptionTypeDao.findById(id);
    if (!clientDescriptionType) {
      throw new ClientDescriptionTypeNotFoundError();
    }
    if (options.onlyActive && !clientDescriptionType.active) {
      throw new ClientDescriptionTypeNotFoundError();
    }

    return clientDescriptionType;
  }
}
