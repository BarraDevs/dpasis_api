import { Inject, Injectable } from '@nestjs/common';
import { ProviderItemInstallmentStatus } from 'src/app/provider/provider-item/domain/enums/provider-item-installment-status.enum';
import { ProviderItemInstallmentAlreadyPaidError } from 'src/app/provider/provider-item/domain/errors/provider-item-installment-already-paid.error';
import { ProviderItemInstallmentNotFoundError } from 'src/app/provider/provider-item/domain/errors/provider-item-installment-not-found.error';
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

    const installment = await this.providerItemRepository.findInstallmentById(providerItemId, installmentId);
    if (!installment) {
      throw new ProviderItemInstallmentNotFoundError();
    }

    if (installment.status === ProviderItemInstallmentStatus.PAID) {
      throw new ProviderItemInstallmentAlreadyPaidError();
    }

    await this.providerItemRepository.payInstallment(providerItemId, installmentId);

    return { message: 'Parcela marcada como paga com sucesso' };
  }
}
