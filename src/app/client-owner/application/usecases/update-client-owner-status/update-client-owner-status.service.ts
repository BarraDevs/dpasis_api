import { Inject, Injectable } from '@nestjs/common';
import { ClientOwnerNotFoundError } from 'src/app/client-owner/domain/errors/client-owner-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IClientOwnerDao } from '../../persistence/dao/client-owner-dao.interface';

@Injectable()
export class UpdateClientOwnerStatus {
  constructor(
    @Inject(TOKENS.ClientOwnerDao) private readonly clientOwnerDao: IClientOwnerDao,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const clientOwner = await this.clientOwnerDao.findById(id);
    if (!clientOwner) {
      throw new ClientOwnerNotFoundError();
    }

    await this.clientOwnerDao.updateStatus(id, !clientOwner.active);

    return { message: 'Status do proprietário de clientes atualizado com sucesso' };
  }
}
