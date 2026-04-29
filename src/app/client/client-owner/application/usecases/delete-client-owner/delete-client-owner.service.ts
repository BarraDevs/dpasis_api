import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientOwnerNotFoundError } from '../../../domain/errors/client-owner-not-found.error';
import type { IClientOwnerDao } from '../../persistence/dao/client-owner-dao.interface';

@Injectable()
export class DeleteClientOwner {
  constructor(
    @Inject(TOKENS.ClientOwnerDao) private readonly clientOwnerDao: IClientOwnerDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const clientOwner = await this.clientOwnerDao.findById(id);
    if (!clientOwner) {
      throw new ClientOwnerNotFoundError();
    }

    await this.clientOwnerDao.delete(id);

    return { message: 'Proprietário de clientes excluído com sucesso' };
  }
}
