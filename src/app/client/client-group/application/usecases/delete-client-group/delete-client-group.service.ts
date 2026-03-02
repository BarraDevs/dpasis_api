import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientGroupNotFoundError } from '../../../domain/errors/client-group-not-found.error';
import type { IClientGroupDao } from '../../persistence/dao/client-group-dao.interface';

@Injectable()
export class DeleteClientGroup {
  constructor(
    @Inject(TOKENS.ClientGroupDao) private readonly clientGroupDao: IClientGroupDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const clientGroup = await this.clientGroupDao.findById(id);
    if (!clientGroup) {
      throw new ClientGroupNotFoundError();
    }

    await this.clientGroupDao.delete(id);

    return { message: 'Grupo de clientes excluído com sucesso' };
  }
}
