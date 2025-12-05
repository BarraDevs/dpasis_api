import { Inject, Injectable } from '@nestjs/common';
import { ProviderNotFoundError } from 'src/app/provider/domain/errors/provider-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IProviderRepository } from '../../persistence/repository/provider-repository.interface';

@Injectable()
export class UpdateProviderStatus {
  constructor(
    @Inject(TOKENS.ProviderRepository) private providerRepository: IProviderRepository,
  ) {}

  public async execute(id: string): Promise<SuccessMessage> {
    const provider = await this.providerRepository.findById(id);
    if (!provider) {
      throw new ProviderNotFoundError();
    }

    provider.toggleStatus();
    await this.providerRepository.edit(provider);

    return { message: 'Status atualizado com sucesso.' };
  }
}
