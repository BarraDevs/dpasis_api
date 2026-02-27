import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientNotFoundError } from '../../../domain/errors/client-not-found.error';
import type { IClientRepository } from '../../persistence/repository/client-repository.interface';

@Injectable()
export class ActivateClient {
  constructor(
    @Inject(TOKENS.ClientRepository) private readonly clientRepository: IClientRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new ClientNotFoundError();
    }

    client.activate();
    await this.clientRepository.edit(client);

    return { message: 'Cliente ativado com sucesso' };
  }
}
