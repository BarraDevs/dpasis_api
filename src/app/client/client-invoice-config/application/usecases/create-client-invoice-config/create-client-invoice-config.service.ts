import { Inject, Injectable } from '@nestjs/common';
import { FindBankById } from 'src/app/bank/application/usecases/find-bank-by-id/find-bank-by-id.service';
import { FindClientById } from 'src/app/client/client/application/usecases/find-client-by-id/find-client-by-id.service';
import { BillingAddressNotFromClientError } from 'src/app/client/client-invoice-config/domain/errors/billing-address-not-from-client.error';
import { ClientInvoiceConfigAlreadyExistsError } from 'src/app/client/client-invoice-config/domain/errors/client-invoice-config-already-exists.error';
import { ClientInvoiceConfigFactory } from 'src/app/client/client-invoice-config/domain/factories/client-invoice-config.factory';
import { TOKENS } from 'src/core/di/token';
import type { IClientAddressRepository } from 'src/app/client/client-address/application/persistence/repository/client-address-repository.interface';
import type { IClientInvoiceConfigRepository } from '../../persistence/repository/client-invoice-config-repository.interface';
import { CreateClientInvoiceConfigInputDto, CreateClientInvoiceConfigOutputDto } from './dtos/create-client-invoice-config.dto';

@Injectable()
export class CreateClientInvoiceConfig {
  constructor(
    @Inject(TOKENS.ClientInvoiceConfigRepository)
    private readonly clientInvoiceConfigRepository: IClientInvoiceConfigRepository,
    @Inject(TOKENS.ClientAddressRepository)
    private readonly clientAddressRepository: IClientAddressRepository,
    private readonly findClientById: FindClientById,
    private readonly findBankById: FindBankById,
  ) {}

  public async execute(data: CreateClientInvoiceConfigInputDto): Promise<CreateClientInvoiceConfigOutputDto> {
    await this.findClientById.execute(data.clientId, true);

    const existingConfig = await this.clientInvoiceConfigRepository.findByClientId(data.clientId);
    if (existingConfig) {
      throw new ClientInvoiceConfigAlreadyExistsError();
    }

    const billingAddress = await this.clientAddressRepository.findById(data.billingAddressId);
    if (!billingAddress || billingAddress.props.clientId !== data.clientId) {
      throw new BillingAddressNotFromClientError();
    }

    await this.findBankById.execute(data.bankId, true);

    const entity = ClientInvoiceConfigFactory.create({
      clientId: data.clientId,
      generateNf: data.generateNf,
      type: data.type,
      emissionDay: data.emissionDay,
      dueDateType: data.dueDateType,
      dueDateDay: data.dueDateDay ?? null,
      deadlineDays: data.deadlineDays ?? null,
      months: data.months ?? [],
      billingAddressId: data.billingAddressId,
      bankId: data.bankId,
      autoProtestBoleto: data.autoProtestBoleto,
      message: data.message ?? null,
    });

    const id = await this.clientInvoiceConfigRepository.save(entity);

    return { id };
  }
}
