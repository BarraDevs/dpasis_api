import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientGroupAlreadyExistsError } from '../../../domain/errors/client-group-already-exists.error';
import { ClientGroupNotFoundError } from '../../../domain/errors/client-group-not-found.error';
import type { IClientGroupDao } from '../../persistence/dao/client-group-dao.interface';
import { EditClientGroupInputDto } from './dtos/edit-client-group.dto';

@Injectable()
export class EditClientGroup {
  constructor(
    @Inject(TOKENS.ClientGroupDao) private readonly clientGroupDao: IClientGroupDao,
  ) {}

  public async execute(id: number, data: EditClientGroupInputDto): Promise<SuccessMessage> {
    const clientGroup = await this.clientGroupDao.findById(id);
    if (!clientGroup) {
      throw new ClientGroupNotFoundError();
    }

    const existing = await this.clientGroupDao.findByName(data.name.trim());
    if (existing && existing.id !== id) {
      throw new ClientGroupAlreadyExistsError(data.name);
    }

    await this.clientGroupDao.edit(id, data);

    return { message: 'Grupo de clientes atualizado com sucesso' };
  }
}
