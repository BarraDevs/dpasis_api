import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientNotFoundError } from '../../../domain/errors/client-not-found.error';
import type { IClientRepository } from '../../persistence/repository/client-repository.interface';

@Injectable()
export class DeactivateClient {
  constructor(
    @Inject(TOKENS.ClientRepository) private readonly clientRepository: IClientRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new ClientNotFoundError();
    }

    client.deactivate();
    await this.clientRepository.edit(client);

    return { message: 'Cliente desativado com sucesso' };
  }
}
