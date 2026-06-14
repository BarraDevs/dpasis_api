import { TaxInvoiceDto } from '../../../dtos/tax-invoice.dto';
import { NfemailTaxInvoiceDto } from '../dtos/nfemail.dto';

export function mapNfemailToTaxInvoice(data: NfemailTaxInvoiceDto): TaxInvoiceDto {
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
