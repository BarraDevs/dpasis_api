import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientDriveTypeAlreadyExistsError } from '../../../domain/errors/client-drive-type-already-exists.error';
import { ClientDriveTypeNotFoundError } from '../../../domain/errors/client-drive-type-not-found.error';
import type { IClientDriveTypeDao } from '../../persistence/dao/client-drive-type-dao.interface';
import { EditClientDriveTypeInputDto } from './dtos/edit-client-drive-type.dto';

@Injectable()
export class EditClientDriveType {
  constructor(
    @Inject(TOKENS.ClientDriveTypeDao) private readonly clientDriveTypeDao: IClientDriveTypeDao,
  ) {}

  public async execute(id: number, data: EditClientDriveTypeInputDto): Promise<SuccessMessage> {
    const clientDriveType = await this.clientDriveTypeDao.findById(id);
    if (!clientDriveType) {
      throw new ClientDriveTypeNotFoundError();
    }

    const existing = await this.clientDriveTypeDao.findByName(data.name.trim());
    if (existing && existing.id !== id) {
      throw new ClientDriveTypeAlreadyExistsError(data.name);
    }

    await this.clientDriveTypeDao.edit(id, data);

    return { message: 'Tipo de drive de cliente atualizado com sucesso' };
  }
}
