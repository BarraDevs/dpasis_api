import { Inject, Injectable } from '@nestjs/common';
import { ResolveBankIntegrationCredentials } from 'src/app/global/bank/application/usecases/resolve-bank-integration-credentials/resolve-bank-integration-credentials.service';
import { TOKENS } from 'src/core/di/token';
import type { IBankPaymentGateway } from 'src/infra/bank-payment/bank-payment.gateway';
import { BankPaymentDto } from 'src/infra/bank-payment/dtos/bank-payment.dto';
import { BankPaymentStatus } from 'src/infra/bank-payment/enums/bank-payment-status.enum';
import { FindBankPaymentByYourNumberInputDto } from './dtos/find-bank-payment-by-your-number.dto';

const NON_BLOCKING_STATUSES: BankPaymentStatus[] = [BankPaymentStatus.CANCELLED, BankPaymentStatus.FAILED];

@Injectable()
export class FindBankPaymentByYourNumber {
  constructor(
    @Inject(TOKENS.BankPaymentGateway) private readonly bankPaymentGateway: IBankPaymentGateway,
    private readonly resolveBankIntegrationCredentials: ResolveBankIntegrationCredentials,
  ) {}

  public async execute(input: FindBankPaymentByYourNumberInputDto): Promise<BankPaymentDto | null> {
    const credentials = await this.resolveBankIntegrationCredentials.execute(input.bankId);
    const result = await this.bankPaymentGateway.list({
      provider: input.provider,
      startDate: input.dueDate,
      endDate: input.dueDate,
      yourNumber: input.yourNumber,
      page: 1,
      size: 100,
      credentials,
    });

    const match = result.items.find((item) => (
      item.yourNumber === input.yourNumber
      && item.amount === input.amount
      && item.dueDate === input.dueDate
      && !NON_BLOCKING_STATUSES.includes(item.status)
    ));

    return match ?? null;
  }
}
