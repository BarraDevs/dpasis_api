import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { FindByIdOptions } from 'src/core/types/find-by-id-options.type';
import { ClientDriveTypeNotFoundError } from '../../../domain/errors/client-drive-type-not-found.error';
import { ClientDriveTypeDto } from '../../dtos/client-drive-type.dto';
import type { IClientDriveTypeDao } from '../../persistence/dao/client-drive-type-dao.interface';

@Injectable()
export class FindClientDriveTypeById {
  constructor(
    @Inject(TOKENS.ClientDriveTypeDao) private readonly clientDriveTypeDao: IClientDriveTypeDao,
  ) {}

  public async execute(id: number, options: FindByIdOptions = {}): Promise<ClientDriveTypeDto> {
    const clientDriveType = await this.clientDriveTypeDao.findById(id);
    if (!clientDriveType) {
      throw new ClientDriveTypeNotFoundError();
    }
    if (options.onlyActive && !clientDriveType.active) {
      throw new ClientDriveTypeNotFoundError();
    }

    return clientDriveType;
  }
}
