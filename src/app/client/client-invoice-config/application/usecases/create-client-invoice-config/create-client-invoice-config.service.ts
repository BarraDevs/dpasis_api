import { Inject, Injectable } from '@nestjs/common';
import { FindBankById } from 'src/app/bank/application/usecases/find-bank-by-id/find-bank-by-id.service';
import { FindClientAddressByIdAndClientId } from 'src/app/client/client-address/application/usecases/find-client-address-by-id-and-client-id/find-client-address-by-id-and-client-id.service';
import { ClientInvoiceConfigAlreadyExistsError } from 'src/app/client/client-invoice-config/domain/errors/client-invoice-config-already-exists.error';
import { ClientInvoiceConfigFactory } from 'src/app/client/client-invoice-config/domain/factories/client-invoice-config.factory';
import { FindClientById } from 'src/app/client/client/application/usecases/find-client-by-id/find-client-by-id.service';
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
    await this.findBankById.execute(data.bankId, { onlyActive: true });
    await this.findClientById.execute(data.clientId, { onlyActive: true });
    await this.findClientAddressByIdAndClientId.execute(data.billingAddressId, data.clientId);

    const existingConfig = await this.clientInvoiceConfigRepository.findByClientId(data.clientId);
    if (existingConfig) {
      throw new ClientInvoiceConfigAlreadyExistsError();
    }

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
