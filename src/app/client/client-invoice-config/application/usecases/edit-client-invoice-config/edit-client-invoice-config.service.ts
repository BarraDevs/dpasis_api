import { Inject, Injectable } from '@nestjs/common';
import { FindBankById } from 'src/app/bank/application/usecases/find-bank-by-id/find-bank-by-id.service';
import type { IClientAddressDao } from 'src/app/client/client-address/application/persistence/dao/client-address-dao.interface';
import { BillingAddressNotFromClientError } from 'src/app/client/client-address/domain/errors/billing-address-not-from-client.error';
import { ClientInvoiceConfigNotFoundError } from 'src/app/client/client-invoice-config/domain/errors/client-invoice-config-not-found.error';
import { ClientInvoiceConfigFactory } from 'src/app/client/client-invoice-config/domain/factories/client-invoice-config.factory';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IClientInvoiceConfigDao } from '../../persistence/dao/client-invoice-config-dao.interface';
import type { IClientInvoiceConfigRepository } from '../../persistence/repository/client-invoice-config-repository.interface';
import { EditClientInvoiceConfigInputDto } from './dtos/edit-client-invoice-config.dto';

@Injectable()
export class EditClientInvoiceConfig {
  constructor(
    @Inject(TOKENS.ClientAddressDao) private readonly clientAddressDao: IClientAddressDao,
    @Inject(TOKENS.ClientInvoiceConfigDao) private readonly clientInvoiceConfigDao: IClientInvoiceConfigDao,
    @Inject(TOKENS.ClientInvoiceConfigRepository) private readonly clientInvoiceConfigRepository: IClientInvoiceConfigRepository,
    private readonly findBankById: FindBankById,
  ) {}

  public async execute(id: number, data: EditClientInvoiceConfigInputDto): Promise<SuccessMessage> {
    const existing = await this.clientInvoiceConfigDao.findById(id);
    if (!existing) {
      throw new ClientInvoiceConfigNotFoundError();
    }

    if (data.billingAddressId != null) {
      const billingAddress = await this.clientAddressDao.findById(data.billingAddressId);
      if (!billingAddress || billingAddress.clientId !== existing.clientId) {
        throw new BillingAddressNotFromClientError();
      }
    }

    const entity = ClientInvoiceConfigFactory.edit({
      ...existing,
      ...data,
    });

    if (data.bankId != null) {
      await this.findBankById.execute(data.bankId, true);
    }

    await this.clientInvoiceConfigRepository.edit(entity);

    return { message: 'Edição realizada com sucesso' };
  }
}
