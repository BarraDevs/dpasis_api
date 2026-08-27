import { BankPaymentDto } from './dtos/bank-payment.dto';
import { BankPaymentPdfDto } from './dtos/bank-payment-pdf.dto';
import { CancelBankPaymentInputDto } from './dtos/cancel-bank-payment.dto';
import { FindBankPaymentInputDto } from './dtos/find-bank-payment.dto';
import { IssueBankPaymentInputDto, IssueBankPaymentOutputDto } from './dtos/issue-bank-payment.dto';

export interface IBankPaymentGateway {
  issue(input: IssueBankPaymentInputDto): Promise<IssueBankPaymentOutputDto>;
  find(input: FindBankPaymentInputDto): Promise<BankPaymentDto>;
  getPdf(input: FindBankPaymentInputDto): Promise<BankPaymentPdfDto>;
  cancel(input: CancelBankPaymentInputDto): Promise<void>;
}
