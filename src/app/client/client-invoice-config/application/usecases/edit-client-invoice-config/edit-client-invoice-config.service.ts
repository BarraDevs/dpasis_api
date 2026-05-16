import { Inject, Injectable } from '@nestjs/common';
import { FindClientAddressByIdAndClientId } from 'src/app/client/client-address/application/usecases/find-client-address-by-id-and-client-id/find-client-address-by-id-and-client-id.service';
import { ClientInvoiceConfigNotFoundError } from 'src/app/client/client-invoice-config/domain/errors/client-invoice-config-not-found.error';
import { ClientInvoiceConfigFactory } from 'src/app/client/client-invoice-config/domain/factories/client-invoice-config.factory';
import { FindBankById } from 'src/app/global/bank/application/usecases/find-bank-by-id/find-bank-by-id.service';
import { TOKENS } from 'src/core/di/token';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import type { IClientInvoiceConfigRepository } from '../../persistence/repository/client-invoice-config-repository.interface';
import { EditClientInvoiceConfigInputDto } from './dtos/edit-client-invoice-config.dto';

@Injectable()
export class EditClientInvoiceConfig {
  constructor(
    @Inject(TOKENS.ClientInvoiceConfigRepository) private readonly clientInvoiceConfigRepository: IClientInvoiceConfigRepository,
    private readonly findClientAddressByIdAndClientId: FindClientAddressByIdAndClientId,
    private readonly findBankById: FindBankById,
  ) {}

  public async execute(id: number, data: EditClientInvoiceConfigInputDto): Promise<SuccessMessage> {
    const loaded = await this.clientInvoiceConfigRepository.findById(id);
    if (!loaded) {
      throw new ClientInvoiceConfigNotFoundError();
    }

    const entity = ClientInvoiceConfigFactory.edit({
      ...loaded.props,
      ...data,
    });

    if (data.bankId != null) {
      await this.findBankById.execute(data.bankId, { onlyActive: true });
    }
    if (data.billingAddressId != null) {
      await this.findClientAddressByIdAndClientId.execute(data.billingAddressId, loaded.props.clientId, { onlyActive: true });
    }

    await this.clientInvoiceConfigRepository.edit(entity);

    return { message: 'Edição realizada com sucesso' };
  }
}
