import { TaxInvoiceIssueFormat } from '../enums/tax-invoice-issue-format.enum';
import { TaxInvoiceDto } from './tax-invoice.dto';

export class IssueTaxInvoiceInputDto {
  content: string;
  format: TaxInvoiceIssueFormat;
}

export class IssueTaxInvoiceOutputDto {
  externalId: number;
  taxInvoice?: TaxInvoiceDto;
}
