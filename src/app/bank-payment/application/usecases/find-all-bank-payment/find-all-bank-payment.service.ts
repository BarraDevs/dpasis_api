import { Inject, Injectable } from '@nestjs/common';
import { ResolveBankIntegrationCredentials } from 'src/app/global/bank/application/usecases/resolve-bank-integration-credentials/resolve-bank-integration-credentials.service';
import { TOKENS } from 'src/core/di/token';
import type { IBankPaymentGateway } from 'src/infra/bank-payment/bank-payment.gateway';
import { BankPaymentDto } from 'src/infra/bank-payment/dtos/bank-payment.dto';
import { IPagination, Pagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { FindAllBankPaymentQueryDto } from './dtos/find-all-bank-payment.dto';

@Injectable()
export class FindAllBankPayment {
  constructor(
    @Inject(TOKENS.BankPaymentGateway) private readonly bankPaymentGateway: IBankPaymentGateway,
    private readonly resolveBankIntegrationCredentials: ResolveBankIntegrationCredentials,
  ) {}

  public async execute(queries: FindAllBankPaymentQueryDto): Promise<IPagination<BankPaymentDto>> {
    const page = queries.page ?? 1;
    const size = queries.size ?? 100;
    const credentials = await this.resolveBankIntegrationCredentials.execute(queries.bankId);

    const result = await this.bankPaymentGateway.list({
      provider: queries.provider,
      startDate: queries.startDate,
      endDate: queries.endDate,
      status: queries.status,
      payerName: queries.payerName,
      payerDocument: queries.payerDocument,
      page,
      size,
      credentials,
    });

    return new Pagination(result.items, result.total, page, size).getDto();
  }
}
