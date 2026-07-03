import { Inject, Injectable } from '@nestjs/common';
import { FindBankById } from 'src/app/global/bank/application/usecases/find-bank-by-id/find-bank-by-id.service';
import { ProviderItemInstallmentStatus } from 'src/app/provider/provider-item/domain/enums/provider-item-installment-status.enum';
import { ProviderItemInstallmentProps } from 'src/app/provider/provider-item/domain/entities/provider-item.entity';
import { ProviderItemNotFoundError } from 'src/app/provider/provider-item/domain/errors/provider-item-not-found.error';
import { ProviderItemFactory } from 'src/app/provider/provider-item/domain/factories/provider-item.factory';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IProviderItemRepository } from '../../persistence/repository/provider-item-repository.interface';
import { EditProviderItemInputDto } from './dtos/edit-provider-item.dto';

@Injectable()
export class EditProviderItem {
  constructor(
    @Inject(TOKENS.ProviderItemRepository) private readonly providerItemRepository: IProviderItemRepository,
    private readonly findBankById: FindBankById,
  ) {}

  public async execute(id: number, data: EditProviderItemInputDto): Promise<SuccessMessage> {
    const existing = await this.providerItemRepository.findById(id);
    if (!existing) {
      throw new ProviderItemNotFoundError();
    }

    const props = existing.props;

    if (data.bankId != null) {
      await this.findBankById.execute(data.bankId, { onlyActive: true });
    }

    const scheduleFieldsChanged = [
      data.totalValueInCents,
      data.installmentsCount,
      data.scheduleType,
      data.intervalDays,
      data.dueDay,
      data.firstDueDate,
    ].some((value) => value !== undefined);

    const paidInstallments = props.installments.filter(
      (installment: ProviderItemInstallmentProps) =>
        installment.status === ProviderItemInstallmentStatus.PAID,
    );

    if (scheduleFieldsChanged || data.description != null || data.bankId != null) {
      const entity = ProviderItemFactory.edit({
        id: props.id!,
        active: props.active,
        providerId: props.providerId,
        description: data.description ?? props.description,
        totalValueInCents: data.totalValueInCents ?? props.totalValueInCents,
        installmentsCount: data.installmentsCount ?? props.installmentsCount,
        scheduleType: data.scheduleType ?? props.scheduleType,
        intervalDays: data.intervalDays !== undefined ? data.intervalDays : props.intervalDays,
        dueDay: data.dueDay !== undefined ? data.dueDay : props.dueDay,
        firstDueDate: data.firstDueDate ? new Date(data.firstDueDate) : props.firstDueDate,
        bankId: data.bankId ?? props.bankId,
        paidInstallments,
      });

      await this.providerItemRepository.edit(entity);
    }

    return { message: 'Item do prestador atualizado com sucesso' };
  }
}
