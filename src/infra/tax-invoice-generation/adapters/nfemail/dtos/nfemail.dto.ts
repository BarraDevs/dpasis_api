/* eslint-disable camelcase */
export class NfemailTaxInvoiceDto {
  row_id: number;
  nfe_numero: number;
  ped_numero: number;
  cod_nfemail: number;
  num_cnpj: string;
  nom_fantasia: string;
  nom_razaosocial: string;
  cod_processo: number;
  dsc_processo: string;
  nfe_chave: string;
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
