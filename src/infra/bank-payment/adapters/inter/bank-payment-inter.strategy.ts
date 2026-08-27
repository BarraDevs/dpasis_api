import { Injectable } from '@nestjs/common';
import { BankPaymentDto } from '../../dtos/bank-payment.dto';
import { BankPaymentPdfDto } from '../../dtos/bank-payment-pdf.dto';
import { CancelBankPaymentInputDto } from '../../dtos/cancel-bank-payment.dto';
import { FindBankPaymentInputDto } from '../../dtos/find-bank-payment.dto';
import { IssueBankPaymentInputDto, IssueBankPaymentOutputDto } from '../../dtos/issue-bank-payment.dto';
import { BankPaymentProvider } from '../../enums/bank-payment-provider.enum';
import type { IBankPaymentStrategy } from '../../strategies/bank-payment.strategy';
import { InterCobrancaClient } from './cobranca/inter-cobranca.client';

@Injectable()
export class BankPaymentInterStrategy implements IBankPaymentStrategy {
  public readonly provider = BankPaymentProvider.INTER;

  constructor(private readonly cobrancaClient: InterCobrancaClient) {}

  public async issue(input: IssueBankPaymentInputDto): Promise<IssueBankPaymentOutputDto> {
    return this.cobrancaClient.issue(input);
  }

  public async find(input: FindBankPaymentInputDto): Promise<BankPaymentDto> {
    return this.cobrancaClient.find(input);
  }

  public async getPdf(input: FindBankPaymentInputDto): Promise<BankPaymentPdfDto> {
    return this.cobrancaClient.getPdf(input);
  }

  public async cancel(input: CancelBankPaymentInputDto): Promise<void> {
    return this.cobrancaClient.cancel(input);
  }
}
