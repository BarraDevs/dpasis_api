import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ClientContactNotFoundError } from '../../../domain/errors/client-contact-not-found.error';
import type { IClientContactRepository } from '../../persistence/repository/client-contact-repository.interface';

@Injectable()
export class DeactivateClientContact {
  constructor(
    @Inject(TOKENS.ClientContactRepository) private readonly clientContactRepository: IClientContactRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const contact = await this.clientContactRepository.findById(id);
    if (!contact) {
      throw new ClientContactNotFoundError();
    }

    contact.deactivate();
    await this.clientContactRepository.edit(contact);

    return { message: 'Contato do cliente desativado com sucesso' };
  }
}
