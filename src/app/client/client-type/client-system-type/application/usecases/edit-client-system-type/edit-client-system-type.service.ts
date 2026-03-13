import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientSystemTypeAlreadyExistsError } from '../../../domain/errors/client-system-type-already-exists.error';
import { ClientSystemTypeNotFoundError } from '../../../domain/errors/client-system-type-not-found.error';
import type { IClientSystemTypeDao } from '../../persistence/dao/client-system-type-dao.interface';
import { EditClientSystemTypeInputDto } from './dtos/edit-client-system-type.dto';

@Injectable()
export class EditClientSystemType {
  constructor(
    @Inject(TOKENS.ClientSystemTypeDao) private readonly clientSystemTypeDao: IClientSystemTypeDao,
  ) {}

  public async execute(id: number, data: EditClientSystemTypeInputDto): Promise<SuccessMessage> {
    const clientSystemType = await this.clientSystemTypeDao.findById(id);
    if (!clientSystemType) {
      throw new ClientSystemTypeNotFoundError();
    }

    const existing = await this.clientSystemTypeDao.findByName(data.name.trim());
    if (existing && existing.id !== id) {
      throw new ClientSystemTypeAlreadyExistsError(data.name);
    }

    await this.clientSystemTypeDao.edit(id, data);

    return { message: 'Tipo de sistema de cliente atualizado com sucesso' };
  }
}
