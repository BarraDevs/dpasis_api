import { Inject, Injectable } from '@nestjs/common';
import { FindClientAddressByIdAndClientId } from 'src/app/client/client-address/application/usecases/find-client-address-by-id-and-client-id/find-client-address-by-id-and-client-id.service';
import { ClientInvoiceConfigAlreadyExistsError } from 'src/app/client/client-invoice-config/domain/errors/client-invoice-config-already-exists.error';
import { ClientInvoiceConfigFactory } from 'src/app/client/client-invoice-config/domain/factories/client-invoice-config.factory';
import { FindClientById } from 'src/app/client/client/application/usecases/find-client-by-id/find-client-by-id.service';
import { FindBankById } from 'src/app/global/bank/application/usecases/find-bank-by-id/find-bank-by-id.service';
import { TOKENS } from 'src/core/di/token';
import type { IClientInvoiceConfigRepository } from '../../persistence/repository/client-invoice-config-repository.interface';
import { CreateClientInvoiceConfigInputDto, CreateClientInvoiceConfigOutputDto } from './dtos/create-client-invoice-config.dto';

@Injectable()
export class CreateClientInvoiceConfig {
  constructor(
    @Inject(TOKENS.ClientInvoiceConfigRepository) private readonly clientInvoiceConfigRepository: IClientInvoiceConfigRepository,
    private readonly findClientAddressByIdAndClientId: FindClientAddressByIdAndClientId,
    private readonly findClientById: FindClientById,
    private readonly findBankById: FindBankById,
  ) {}

  public async execute(data: CreateClientInvoiceConfigInputDto): Promise<CreateClientInvoiceConfigOutputDto> {
    const bank = await this.findBankById.execute(data.bankId, { onlyActive: true });
    const client = await this.findClientById.execute(data.clientId, { onlyActive: true });
    const billingAddress = await this.findClientAddressByIdAndClientId.execute(data.billingAddressId, client.id, { onlyActive: true });

    const existingConfig = await this.clientInvoiceConfigRepository.findByClientId(client.id);
    if (existingConfig) {
      throw new ClientInvoiceConfigAlreadyExistsError();
    }

    const entity = ClientInvoiceConfigFactory.create({
      clientId: client.id,
      generateNf: data.generateNf,
      type: data.type,
      emissionDay: data.emissionDay,
      dueDateType: data.dueDateType,
      dueDateDay: data.dueDateDay,
      dueMonth: data.dueMonth,
      deadlineDays: data.deadlineDays,
      months: data.months ?? [],
      billingAddressId: billingAddress.id,
      bankId: bank.id,
      autoProtestBoleto: data.autoProtestBoleto,
      issWithheld: data.issWithheld,
      message: data.message,
    });

    const id = await this.clientInvoiceConfigRepository.save(entity);

    return { id };
  }
}
