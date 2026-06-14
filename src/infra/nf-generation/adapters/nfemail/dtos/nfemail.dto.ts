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

export class NfemailInvalidationDto {
  cod_ambiente: number;
  num_ano: number;
  num_serie: number;
  num_inicial: number;
  num_final: number;
  dsc_motivo: string;
}

export class NfemailFindAllInvalidationsResponseDto {
  ListaInutilizadas: NfemailInvalidationDto[];
  Paginacao: NfemailPaginationDto;
}

export class NfemailInvalidationResultDto {
  cod_retorno: number;
  dsc_retorno: string;
}
