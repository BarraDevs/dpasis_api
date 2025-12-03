import { Inject, Injectable } from '@nestjs/common';
import { ClientNotFoundError } from 'src/app/client/domain/errors/client-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IClientRepository } from '../../persistence/repository/client-repository.interface';

@Injectable()
export class UpdateClientStatus {
  constructor(
    @Inject(TOKENS.ClientRepository) private clientRepository: IClientRepository,
  ) {}

  public async execute(id: string): Promise<SuccessMessage> {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new ClientNotFoundError();
    }

    client.toggleStatus();
    await this.clientRepository.edit(client);

    return { message: 'Status atualizado com sucesso.' };
  }
}
