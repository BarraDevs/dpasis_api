import { NfInvalidationDto } from '../../../dtos/find-all-invalidations.dto';
import { InvalidateNfNumbersOutputDto } from '../../../dtos/invalidate-numbers.dto';
import { NfDto } from '../../../dtos/nf.dto';
import { NfemailInvalidationDto, NfemailInvalidationResultDto, NfemailTaxInvoiceDto } from '../dtos/nfemail.dto';

export function mapNfemailToNf(data: NfemailTaxInvoiceDto): NfDto {
  return {
    externalId: data.cod_nfemail,
    rowId: data.row_id,
    number: data.nfe_numero ?? null,
    orderCode: data.ped_numero ?? null,
    recipientDocument: data.num_cnpj ?? '',
    fantasyName: data.nom_fantasia ?? '',
    companyName: data.nom_razaosocial ?? '',
    processCode: data.cod_processo,
    processDescription: data.dsc_processo ?? '',
    accessKey: data.nfe_chave?.trim() || null,
  };
}

export function mapNfemailIssueResponse(data: unknown): number | null {
  if (typeof data === 'number' && Number.isFinite(data)) {
    return data;
  }

  if (typeof data === 'string' && data.trim()) {
    const parsed = Number(data.trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const candidates = [
      record.cod_nfemail,
      record.CodNfemail,
      record.id,
      record.Id,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        return candidate;
      }
      if (typeof candidate === 'string' && candidate.trim()) {
        const parsed = Number(candidate.trim());
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    if ('cod_nfemail' in record) {
      const externalId = record.cod_nfemail;
      if (typeof externalId === 'number' && Number.isFinite(externalId)) {
        return externalId;
      }
      if (typeof externalId === 'string' && externalId.trim()) {
        const parsed = Number(externalId.trim());
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }
  }

  return null;
}

export function mapNfemailInvalidation(data: NfemailInvalidationDto): NfInvalidationDto {
  return {
    environment: data.cod_ambiente,
    year: data.num_ano,
    series: data.num_serie,
    startNumber: data.num_inicial,
    endNumber: data.num_final,
    reason: data.dsc_motivo ?? '',
  };
}

export function mapNfemailInvalidationResult(data: NfemailInvalidationResultDto): InvalidateNfNumbersOutputDto {
  return {
    code: data.cod_retorno,
    description: data.dsc_retorno ?? '',
  };
}

export function extractNfemailTaxInvoices(data: unknown): NfemailTaxInvoiceDto[] {
  if (Array.isArray(data)) {
    return data as NfemailTaxInvoiceDto[];
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;

    if (Array.isArray(record.ListaNotaFiscal)) {
      return record.ListaNotaFiscal as NfemailTaxInvoiceDto[];
    }

    if (record.cod_nfemail) {
      return [data as NfemailTaxInvoiceDto];
    }
  }

  return [];
}

export function extractNfemailInvalidations(data: unknown): NfemailInvalidationDto[] {
  if (Array.isArray(data)) {
    return data as NfemailInvalidationDto[];
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;

    if (Array.isArray(record.ListaInutilizadas)) {
      return record.ListaInutilizadas as NfemailInvalidationDto[];
    }
  }

  return [];
}

export function extractNfemailPagination(data: unknown, fallbackPage: number, fallbackLimit: number, fallbackTotal: number) {
  if (data && typeof data === 'object' && 'Paginacao' in (data as object)) {
    const pagination = (data as { Paginacao?: { page?: number; limit?: number; records?: number } }).Paginacao;
    return {
      page: pagination?.page ?? fallbackPage,
      limit: pagination?.limit ?? fallbackLimit,
      total: pagination?.records ?? fallbackTotal,
    };
  }

  return {
    page: fallbackPage,
    limit: fallbackLimit,
    total: fallbackTotal,
  };
}
