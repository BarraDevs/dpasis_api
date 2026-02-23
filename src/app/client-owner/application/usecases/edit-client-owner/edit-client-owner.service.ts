import { Inject, Injectable } from '@nestjs/common';
import { ClientOwnerAlreadyExistsError } from 'src/app/client-owner/domain/errors/client-owner-already-exists.error';
import { ClientOwnerNotFoundError } from 'src/app/client-owner/domain/errors/client-owner-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IClientOwnerDao } from '../../persistence/dao/client-owner-dao.interface';
import { EditClientOwnerInputDto } from './dtos/edit-client-owner.dto';

@Injectable()
export class EditClientOwner {
  constructor(
    @Inject(TOKENS.ClientOwnerDao) private readonly clientOwnerDao: IClientOwnerDao,
  ) {}

  public async execute(id: number, data: EditClientOwnerInputDto): Promise<SuccessMessage> {
    const clientOwner = await this.clientOwnerDao.findById(id);
    if (!clientOwner) {
      throw new ClientOwnerNotFoundError();
    }

    const existing = await this.clientOwnerDao.findByName(data.name.trim());
    if (existing && existing.id !== id) {
      throw new ClientOwnerAlreadyExistsError(data.name);
    }

    await this.clientOwnerDao.edit(id, data);

    return { message: 'Proprietário de clientes atualizado com sucesso' };
  }
}
