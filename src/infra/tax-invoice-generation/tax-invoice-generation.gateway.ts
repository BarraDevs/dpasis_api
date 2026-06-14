import { CancelTaxInvoiceInputDto } from './dtos/cancel-tax-invoice.dto';
import { FindAllTaxInvoicesInputDto, FindAllTaxInvoicesOutputDto } from './dtos/find-all-tax-invoices.dto';
import { IssueTaxInvoiceInputDto, IssueTaxInvoiceOutputDto } from './dtos/issue-tax-invoice.dto';
import { TaxInvoiceDto } from './dtos/tax-invoice.dto';

export interface ITaxInvoiceGenerationGateway {
  issue(input: IssueTaxInvoiceInputDto): Promise<IssueTaxInvoiceOutputDto>;
  findById(externalId: number): Promise<TaxInvoiceDto>;
  findAll(query: FindAllTaxInvoicesInputDto): Promise<FindAllTaxInvoicesOutputDto>;
  cancel(input: CancelTaxInvoiceInputDto): Promise<void>;
}
