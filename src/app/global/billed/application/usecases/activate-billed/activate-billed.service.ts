import { Inject, Injectable } from '@nestjs/common';
import { BilledNotFoundError } from 'src/app/global/billed/domain/errors/billed-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IBilledRepository } from '../../persistence/repository/billed-repository.interface';

@Injectable()
export class ActivateBilled {
  constructor(
    @Inject(TOKENS.BilledRepository) private readonly billedRepository: IBilledRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const billed = await this.billedRepository.findById(id);
    if (!billed) {
      throw new BilledNotFoundError();
    }

    billed.activate();
    await this.billedRepository.edit(billed);

    return { message: 'Faturado ativado com sucesso' };
  }
}
