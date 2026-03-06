import { Inject, Injectable } from '@nestjs/common';
import { FindBankById } from 'src/app/bank/application/usecases/find-bank-by-id/find-bank-by-id.service';
import { FindClientAddressByIdAndClientId } from 'src/app/client/client-address/application/usecases/find-client-address-by-id-and-client-id/find-client-address-by-id-and-client-id.service';
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
    @Inject(TOKENS.ClientInvoiceConfigDao) private readonly clientInvoiceConfigDao: IClientInvoiceConfigDao,
    @Inject(TOKENS.ClientInvoiceConfigRepository) private readonly clientInvoiceConfigRepository: IClientInvoiceConfigRepository,
    private readonly findClientAddressByIdAndClientId: FindClientAddressByIdAndClientId,
    private readonly findBankById: FindBankById,
  ) {}

  public async execute(id: number, data: EditClientInvoiceConfigInputDto): Promise<SuccessMessage> {
    const existing = await this.clientInvoiceConfigDao.findById(id);
    if (!existing) {
      throw new ClientInvoiceConfigNotFoundError();
    }

    const entity = ClientInvoiceConfigFactory.edit({
      ...existing,
      ...data,
    });

    if (data.bankId != null) {
      await this.findBankById.execute(data.bankId, true);
    }
    if (data.billingAddressId != null) {
      await this.findClientAddressByIdAndClientId.execute(data.billingAddressId, existing.clientId);
    }

    await this.clientInvoiceConfigRepository.edit(entity);

    return { message: 'Edição realizada com sucesso' };
  }
}
