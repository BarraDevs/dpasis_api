import { BankPaymentDto } from './dtos/bank-payment.dto';
import { BankPaymentPdfDto } from './dtos/bank-payment-pdf.dto';
import { CancelBankPaymentInputDto } from './dtos/cancel-bank-payment.dto';
import { FindBankPaymentInputDto } from './dtos/find-bank-payment.dto';
import { IssueBankPaymentInputDto, IssueBankPaymentOutputDto } from './dtos/issue-bank-payment.dto';
import { ListBankPaymentInputDto, ListBankPaymentOutputDto } from './dtos/list-bank-payment.dto';

export interface IBankPaymentGateway {
  issue(input: IssueBankPaymentInputDto): Promise<IssueBankPaymentOutputDto>;
  find(input: FindBankPaymentInputDto): Promise<BankPaymentDto>;
  list(input: ListBankPaymentInputDto): Promise<ListBankPaymentOutputDto>;
  getPdf(input: FindBankPaymentInputDto): Promise<BankPaymentPdfDto>;
  cancel(input: CancelBankPaymentInputDto): Promise<void>;
}
