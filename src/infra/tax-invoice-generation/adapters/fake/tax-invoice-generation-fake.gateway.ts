import { Injectable } from '@nestjs/common';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { CancelTaxInvoiceInputDto } from '../../dtos/cancel-tax-invoice.dto';
import { FindAllTaxInvoicesInputDto, FindAllTaxInvoicesOutputDto } from '../../dtos/find-all-tax-invoices.dto';
import { IssueTaxInvoiceInputDto, IssueTaxInvoiceOutputDto } from '../../dtos/issue-tax-invoice.dto';
import { TaxInvoiceDto } from '../../dtos/tax-invoice.dto';
import { TaxInvoiceProcessCode } from '../../enums/tax-invoice-process-code.enum';
import { ITaxInvoiceGenerationGateway } from '../../tax-invoice-generation.gateway';

@Injectable()
export class TaxInvoiceGenerationFakeAdapterGateway implements ITaxInvoiceGenerationGateway {
  private static nextExternalId = 1;

  private readonly store = new Map<number, TaxInvoiceDto>();

  public async issue(input: IssueTaxInvoiceInputDto): Promise<IssueTaxInvoiceOutputDto> {
    if (!input.content?.trim()) {
      throw new ExternalApiError('Conteúdo da nota fiscal é obrigatório');
    }

    const externalId = TaxInvoiceGenerationFakeAdapterGateway.nextExternalId++;
    const taxInvoice: TaxInvoiceDto = {
      externalId,
      rowId: externalId,
      number: null,
      orderCode: null,
      recipientDocument: '00000000000000',
      fantasyName: 'Cliente Fake',
      companyName: 'Cliente Fake LTDA',
      processCode: TaxInvoiceProcessCode.VALIDATED,
      processDescription: 'validada',
      accessKey: null,
    };

    this.store.set(externalId, taxInvoice);

    return {
      externalId,
      taxInvoice,
    };
  }

  public async findById(externalId: number): Promise<TaxInvoiceDto> {
    const taxInvoice = this.store.get(externalId);
    if (!taxInvoice) {
      throw new ExternalApiError('Nota fiscal não encontrada');
    }

    return taxInvoice;
  }

  public async findAll(query: FindAllTaxInvoicesInputDto): Promise<FindAllTaxInvoicesOutputDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    if (limit > 30) {
      throw new ExternalApiError('Limite máximo de 30 registros por página');
    }

    let rows = Array.from(this.store.values());

    if (query.processCode !== undefined) {
      rows = rows.filter(row => row.processCode === query.processCode);
    }

    const total = rows.length;
    const start = (page - 1) * limit;
    const paginatedRows = rows.slice(start, start + limit);

    return {
      rows: paginatedRows,
      page,
      limit,
      total,
    };
  }

  public async cancel(input: CancelTaxInvoiceInputDto): Promise<void> {
    if (!input.reason?.trim() || input.reason.trim().length < 15) {
      throw new ExternalApiError('Motivo do cancelamento deve ter no mínimo 15 caracteres');
    }

    const taxInvoice = this.store.get(input.externalId);
    if (!taxInvoice) {
      throw new ExternalApiError('Nota fiscal não encontrada');
    }

    this.store.set(input.externalId, {
      ...taxInvoice,
      processCode: TaxInvoiceProcessCode.CANCELLED,
      processDescription: 'cancelada',
    });
  }
}
