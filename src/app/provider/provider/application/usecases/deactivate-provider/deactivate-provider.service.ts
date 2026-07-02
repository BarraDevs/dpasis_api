import { Inject, Injectable } from '@nestjs/common';
import { ProviderNotFoundError } from 'src/app/provider/provider/domain/errors/provider-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IProviderRepository } from '../../persistence/repository/provider-repository.interface';

@Injectable()
export class DeactivateProvider {
  constructor(
    @Inject(TOKENS.ProviderRepository) private readonly providerRepository: IProviderRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const provider = await this.providerRepository.findById(id);
    if (!provider) {
      throw new ProviderNotFoundError();
    }

    provider.deactivate();
    await this.providerRepository.edit(provider);

    return { message: 'Prestador desativado com sucesso' };
  }
}
