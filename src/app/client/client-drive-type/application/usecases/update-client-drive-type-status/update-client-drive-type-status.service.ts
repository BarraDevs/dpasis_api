import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientDriveTypeNotFoundError } from '../../../domain/errors/client-drive-type-not-found.error';
import type { IClientDriveTypeDao } from '../../persistence/dao/client-drive-type-dao.interface';

@Injectable()
export class UpdateClientDriveTypeStatus {
  constructor(
    @Inject(TOKENS.ClientDriveTypeDao) private readonly clientDriveTypeDao: IClientDriveTypeDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const clientDriveType = await this.clientDriveTypeDao.findById(id);
    if (!clientDriveType) {
      throw new ClientDriveTypeNotFoundError();
    }

    await this.clientDriveTypeDao.updateStatus(id, !clientDriveType.active);

    return { message: 'Status do tipo de drive de cliente atualizado com sucesso' };
  }
}
