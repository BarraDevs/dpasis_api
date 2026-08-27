import { Injectable } from '@nestjs/common';
import type { IBankPaymentGateway } from '../../bank-payment.gateway';
import { BankPaymentDto } from '../../dtos/bank-payment.dto';
import { CancelBankPaymentInputDto } from '../../dtos/cancel-bank-payment.dto';
import { FindBankPaymentInputDto } from '../../dtos/find-bank-payment.dto';
import { IssueBankPaymentInputDto, IssueBankPaymentOutputDto } from '../../dtos/issue-bank-payment.dto';
import { BankPaymentPersonType } from '../../enums/bank-payment-person-type.enum';
import { BankPaymentProvider } from '../../enums/bank-payment-provider.enum';
import { BankPaymentStatus } from '../../enums/bank-payment-status.enum';

@Injectable()
export class BankPaymentFakeAdapterGateway implements IBankPaymentGateway {
  public readonly issueCalls: IssueBankPaymentInputDto[] = [];
  public readonly findCalls: FindBankPaymentInputDto[] = [];
  public readonly cancelCalls: CancelBankPaymentInputDto[] = [];

  public issueResult: IssueBankPaymentOutputDto = {
    provider: BankPaymentProvider.INTER,
    requestCode: 'fake-request-code',
  };

  public findResult: BankPaymentDto = {
    provider: BankPaymentProvider.INTER,
    requestCode: 'fake-request-code',
    yourNumber: 'FAKE-1',
    status: BankPaymentStatus.EMITTED,
    amount: 100,
    dueDate: '2026-09-01',
    daysAfterDue: 30,
    payer: {
      document: '11122233344',
      personType: BankPaymentPersonType.INDIVIDUAL,
      name: 'Pagador Fake',
    },
    boleto: {
      ourNumber: '123',
      barcode: 'fake-barcode',
      digitableLine: 'fake-line',
    },
    pix: {
      txid: 'fake-txid',
      copyAndPaste: 'fake-pix',
    },
  };

  public issueError: Error | null = null;
  public findError: Error | null = null;
  public cancelError: Error | null = null;

  public async issue(input: IssueBankPaymentInputDto): Promise<IssueBankPaymentOutputDto> {
    this.issueCalls.push(input);
    if (this.issueError) {
      return Promise.reject(this.issueError);
    }
    return Promise.resolve(this.issueResult);
  }

  public async find(input: FindBankPaymentInputDto): Promise<BankPaymentDto> {
    this.findCalls.push(input);
    if (this.findError) {
      return Promise.reject(this.findError);
    }
    return Promise.resolve({
      ...this.findResult,
      requestCode: input.requestCode,
    });
  }

  public async cancel(input: CancelBankPaymentInputDto): Promise<void> {
    this.cancelCalls.push(input);
    if (this.cancelError) {
      return Promise.reject(this.cancelError);
    }
    return Promise.resolve();
  }
}
