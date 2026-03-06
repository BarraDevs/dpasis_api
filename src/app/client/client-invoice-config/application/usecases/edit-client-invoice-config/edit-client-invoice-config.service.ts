import { Inject, Injectable } from '@nestjs/common';
import { FindBankById } from 'src/app/bank/application/usecases/find-bank-by-id/find-bank-by-id.service';
import { BillingAddressNotFromClientError } from 'src/app/client/client-invoice-config/domain/errors/billing-address-not-from-client.error';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigNotFoundError } from 'src/app/client/client-invoice-config/domain/errors/client-invoice-config-not-found.error';
import { ClientInvoiceConfigFactory } from 'src/app/client/client-invoice-config/domain/factories/client-invoice-config.factory';
import { TOKENS } from 'src/core/di/token';
import type { IClientAddressRepository } from 'src/app/client/client-address/application/persistence/repository/client-address-repository.interface';
import type { IClientInvoiceConfigRepository } from '../../persistence/repository/client-invoice-config-repository.interface';
import { EditClientInvoiceConfigInputDto } from './dtos/edit-client-invoice-config.dto';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';

@Injectable()
export class EditClientInvoiceConfig {
  constructor(
    @Inject(TOKENS.ClientInvoiceConfigRepository)
    private readonly clientInvoiceConfigRepository: IClientInvoiceConfigRepository,
    @Inject(TOKENS.ClientAddressRepository)
    private readonly clientAddressRepository: IClientAddressRepository,
    private readonly findBankById: FindBankById,
  ) {}

  public async execute(id: number, data: EditClientInvoiceConfigInputDto): Promise<SuccessMessage> {
    const existing = await this.clientInvoiceConfigRepository.findById(id);
    if (!existing) {
      throw new ClientInvoiceConfigNotFoundError();
    }

    const mergedProps = {
      ...existing.props,
      ...data,
      id: existing.props.id!,
      clientId: existing.props.clientId,
    };

    if (mergedProps.dueDateType === ClientInvoiceConfigDueDateType.DEADLINE) {
      mergedProps.dueDateDay = null;
    } else {
      mergedProps.deadlineDays = null;
    }

    if (data.billingAddressId != null) {
      const billingAddress = await this.clientAddressRepository.findById(data.billingAddressId);
      if (!billingAddress || billingAddress.props.clientId !== existing.props.clientId) {
        throw new BillingAddressNotFromClientError();
      }
    }

    if (data.bankId != null) {
      await this.findBankById.execute(data.bankId, true);
    }

    const entity = ClientInvoiceConfigFactory.edit({
      ...mergedProps,
      dueDateDay: mergedProps.dueDateDay ?? null,
      deadlineDays: mergedProps.deadlineDays ?? null,
      months: mergedProps.months ?? [],
      message: mergedProps.message ?? null,
    });

    await this.clientInvoiceConfigRepository.edit(entity);

    return { message: 'Edição realizada com sucesso' };
  }
}
