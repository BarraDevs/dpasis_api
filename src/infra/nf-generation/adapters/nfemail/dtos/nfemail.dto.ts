/* eslint-disable camelcase */
export class NfemailFindAllQueryDto {
  page: number;
  limit: number;
  pedido?: string;
  numero?: number;
  cpfcnpj?: string;
  status?: number;
}

export class NfemailTaxInvoiceDto {
  row_id: number;
  nfe_numero: number;
  ped_numero: string;
  cod_nfemail: number;
  num_cnpj: string;
  nom_fantasia: string;
  nom_razaosocial: string;
  cod_processo: number;
  dsc_processo: string;
  nfe_chave: string;
  val_total: string;
  dat_emissao: string;
  dat_autorizacao: string;
  cod_cancelamento: string;
  dsc_cancelamento: string;
  mot_cancelamento: string;
}

export class NfemailPaginationDto {
  page: number;
  limit: number;
  records: number;
}

export class NfemailFindAllResponseDto {
  ListaNotaFiscal: NfemailTaxInvoiceDto[];
  Paginacao: NfemailPaginationDto;
}
