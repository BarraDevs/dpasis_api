import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientDescriptionTypeAlreadyExistsError } from '../../../domain/errors/client-description-type-already-exists.error';
import { ClientDescriptionTypeNotFoundError } from '../../../domain/errors/client-description-type-not-found.error';
import type { IClientDescriptionTypeDao } from '../../persistence/dao/client-description-type-dao.interface';
import { EditClientDescriptionTypeInputDto } from './dtos/edit-client-description-type.dto';

@Injectable()
export class EditClientDescriptionType {
  constructor(
    @Inject(TOKENS.ClientDescriptionTypeDao) private readonly clientDescriptionTypeDao: IClientDescriptionTypeDao,
  ) {}

  public async execute(id: number, data: EditClientDescriptionTypeInputDto): Promise<SuccessMessage> {
    const clientDescriptionType = await this.clientDescriptionTypeDao.findById(id);
    if (!clientDescriptionType) {
      throw new ClientDescriptionTypeNotFoundError();
    }

    const existing = await this.clientDescriptionTypeDao.findByName(data.name.trim());
    if (existing && existing.id !== id) {
      throw new ClientDescriptionTypeAlreadyExistsError(data.name);
    }

    await this.clientDescriptionTypeDao.edit(id, data);

    return { message: 'Tipo de descrição de cliente atualizado com sucesso' };
  }
}
