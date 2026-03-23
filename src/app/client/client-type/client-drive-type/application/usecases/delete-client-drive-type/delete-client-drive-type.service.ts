import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientDriveTypeInUseError } from '../../../domain/errors/client-drive-type-in-use.error';
import { ClientDriveTypeNotFoundError } from '../../../domain/errors/client-drive-type-not-found.error';
import type { IClientDriveTypeDao } from '../../persistence/dao/client-drive-type-dao.interface';

@Injectable()
export class DeleteClientDriveType {
  constructor(
    @Inject(TOKENS.ClientDriveTypeDao) private readonly clientDriveTypeDao: IClientDriveTypeDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const clientDriveType = await this.clientDriveTypeDao.findById(id);
    if (!clientDriveType) {
      throw new ClientDriveTypeNotFoundError();
    }

    const clientTypesCount = await this.clientDriveTypeDao.countClientTypesByDriveTypeId(id);
    if (clientTypesCount > 0) {
      throw new ClientDriveTypeInUseError();
    }

    await this.clientDriveTypeDao.delete(id);

    return { message: 'Tipo de drive de cliente excluído com sucesso' };
  }
}
