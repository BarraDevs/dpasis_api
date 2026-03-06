import { Inject, Injectable } from '@nestjs/common';
import { ClientInvoiceConfigDto } from 'src/app/client/client-invoice-config/application/dtos/client-invoice-config.dto';
import { ClientInvoiceConfigNotFoundError } from 'src/app/client/client-invoice-config/domain/errors/client-invoice-config-not-found.error';
import { TOKENS } from 'src/core/di/token';
import type { IClientInvoiceConfigDao } from '../../persistence/dao/client-invoice-config-dao.interface';

@Injectable()
export class FindClientInvoiceConfigByClientId {
  constructor(
    @Inject(TOKENS.ClientInvoiceConfigDao) private readonly clientInvoiceConfigDao: IClientInvoiceConfigDao,
  ) {}

  public async execute(clientId: number): Promise<ClientInvoiceConfigDto> {
    const result = await this.clientInvoiceConfigDao.findByClientId(clientId);
    if (!result) {
      throw new ClientInvoiceConfigNotFoundError();
    }

    return result;
  }
}
