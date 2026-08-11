import { Inject, Injectable } from '@nestjs/common';
import { ProviderItemNotFoundError } from 'src/app/provider/provider-item/domain/errors/provider-item-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IProviderItemRepository } from '../../persistence/repository/provider-item-repository.interface';

@Injectable()
export class PayProviderItemInstallment {
  constructor(
    @Inject(TOKENS.ProviderItemRepository) private readonly providerItemRepository: IProviderItemRepository,
  ) {}

  public async execute(providerItemId: number, installmentId: number): Promise<SuccessMessage> {
    const item = await this.providerItemRepository.findById(providerItemId);
    if (!item) {
      throw new ProviderItemNotFoundError();
    }

    item.payInstallment(installmentId);
    await this.providerItemRepository.edit(item);

    return { message: 'Parcela marcada como paga com sucesso' };
  }
}
