import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ResaleContactNotFoundError } from '../../../domain/errors/resale-contact-not-found.error';
import type { IResaleContactRepository } from '../../persistence/repository/resale-contact-repository.interface';

@Injectable()
export class ActivateResaleContact {
  constructor(
    @Inject(TOKENS.ResaleContactRepository) private readonly resaleContactRepository: IResaleContactRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const contact = await this.resaleContactRepository.findById(id);
    if (!contact) {
      throw new ResaleContactNotFoundError();
    }

    contact.activate();
    await this.resaleContactRepository.edit(contact);

    return { message: 'Contato de revenda ativado com sucesso' };
  }
}
