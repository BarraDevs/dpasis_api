import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientContactNotFoundError } from '../../../domain/errors/client-contact-not-found.error';
import type { IClientContactRepository } from '../../persistence/repository/client-contact-repository.interface';

@Injectable()
export class DeleteClientContact {
  constructor(
    @Inject(TOKENS.ClientContactRepository) private readonly clientContactRepository: IClientContactRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const clientContact = await this.clientContactRepository.findById(id);
    if (!clientContact) {
      throw new ClientContactNotFoundError();
    }

    await this.clientContactRepository.delete(id);

    return { message: 'Contato de cliente excluído com sucesso' };
  }
}
