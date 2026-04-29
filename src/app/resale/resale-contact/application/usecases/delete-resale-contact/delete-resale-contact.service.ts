import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { ResaleContactNotFoundError } from '../../../domain/errors/resale-contact-not-found.error';
import type { IResaleContactRepository } from '../../persistence/repository/resale-contact-repository.interface';

@Injectable()
export class DeleteResaleContact {
  constructor(
    @Inject(TOKENS.ResaleContactRepository) private readonly resaleContactRepository: IResaleContactRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const resaleContact = await this.resaleContactRepository.findById(id);
    if (!resaleContact) {
      throw new ResaleContactNotFoundError();
    }

    await this.resaleContactRepository.delete(id);

    return { message: 'Contato de revenda excluído com sucesso' };
  }
}
