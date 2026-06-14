import { TaxInvoiceDto } from './tax-invoice.dto';

export class FindAllTaxInvoicesInputDto {
  page?: number;
  limit?: number;
  processCode?: number;
}

export class FindAllTaxInvoicesOutputDto {
  rows: TaxInvoiceDto[];
  page: number;
  limit: number;
  total: number;
}
