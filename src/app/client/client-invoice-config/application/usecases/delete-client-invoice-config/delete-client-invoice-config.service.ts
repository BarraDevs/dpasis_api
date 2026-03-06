import { Inject, Injectable } from '@nestjs/common';
import { ClientInvoiceConfigNotFoundError } from 'src/app/client/client-invoice-config/domain/errors/client-invoice-config-not-found.error';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { TOKENS } from 'src/core/di/token';
import type { IClientInvoiceConfigRepository } from '../../persistence/repository/client-invoice-config-repository.interface';

@Injectable()
export class DeleteClientInvoiceConfig {
  constructor(
    @Inject(TOKENS.ClientInvoiceConfigRepository)
    private readonly clientInvoiceConfigRepository: IClientInvoiceConfigRepository,
  ) {}

  public async execute(id: number): Promise<SuccessMessage> {
    const existing = await this.clientInvoiceConfigRepository.findById(id);
    if (!existing) {
      throw new ClientInvoiceConfigNotFoundError();
    }

    await this.clientInvoiceConfigRepository.delete(id);

    return { message: 'Exclusão realizada com sucesso' };
  }
}
