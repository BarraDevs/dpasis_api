import { Inject, Injectable } from '@nestjs/common';
import { Client } from 'src/app/client/domain/entities/client.entity';
import { ClientNotFoundError } from 'src/app/client/domain/errors/client-not-found';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IClientDao } from '../../persistence/dao/client-dao.interface';
import type { IClientRepository } from '../../persistence/repository/client-repository.interface';

@Injectable()
export class UpdateClientStatus {
  constructor(
    @Inject(TOKENS.ClientDao) private clientDao: IClientDao,
    @Inject(TOKENS.ClientRepository) private clientRepository: IClientRepository,
  ) {}

  public async execute(id: string): Promise<SuccessMessage> {
    const clientData = await this.clientDao.findById(id);
    if (!clientData) {
      throw new ClientNotFoundError();
    }

    const { companies, ...rest } = clientData;
    const client = Client.load({
      ...rest,
      companyIds: companies.map(c => c.id),
    });

    client.toggleStatus();
    await this.clientRepository.edit(client);

    return { message: 'Status atualizado com sucesso.' };
  }
}
