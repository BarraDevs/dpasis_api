import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from 'src/core/di/token';
import type { IBankPaymentGateway } from 'src/infra/bank-payment/bank-payment.gateway';
import { BankPaymentPdfDto } from 'src/infra/bank-payment/dtos/bank-payment-pdf.dto';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';

@Injectable()
export class GetBankPaymentPdf {
  constructor(
    @Inject(TOKENS.BankPaymentGateway) private readonly bankPaymentGateway: IBankPaymentGateway,
  ) {}

  public async execute(requestCode: string, provider: BankPaymentProvider): Promise<BankPaymentPdfDto> {
    return this.bankPaymentGateway.getPdf({ provider, requestCode });
  }
}
