/* eslint-disable camelcase -- contrato JSON da API Cobrança Bolepix v3 do Inter */

export type InterTipoPessoa = 'FISICA' | 'JURIDICA';

export type InterPagadorDto = {
  cpfCnpj: string;
  tipoPessoa: InterTipoPessoa;
  nome: string;
  email?: string;
  ddd?: string;
  telefone?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
};

export type InterEmitirCobrancaRequestDto = {
  seuNumero: string;
  valorNominal: number;
  dataVencimento: string;
  numDiasAgenda: number;
  pagador: InterPagadorDto;
};

export type InterEmitirCobrancaResponseDto = {
  codigoSolicitacao: string;
};

export type InterCancelarCobrancaRequestDto = {
  motivoCancelamento: string;
};

export type InterCobrancaBoletoDto = {
  nossoNumero?: string;
  codigoBarras?: string;
  linhaDigitavel?: string;
};

export type InterCobrancaPixDto = {
  txid?: string;
  pixCopiaECola?: string;
};

export type InterCobrancaDescontoDto = {
  codigo?: string;
  quantidadeDias?: number;
  taxa?: number;
  valor?: number;
};

export type InterCobrancaMultaDto = {
  codigo?: string;
  taxa?: number;
  valor?: number;
};

export type InterCobrancaMoraDto = {
  codigo?: string;
  taxa?: number;
  valor?: number;
};

export type InterCobrancaNotaFiscalDto = {
  chaveNFe?: string;
  numero?: number;
  serie?: number;
  dataEmissao?: string;
  parcela?: number;
  naturezaOperacao?: string;
};

/**
 * Bloco `cobranca` do GET /cobrancas/{codigoSolicitacao} (Bolepix v3).
 * Campos extras do Inter ficam tipados aqui; o mapper normalizado usa o subset do port.
 */
export type InterCobrancaDadosDto = {
  codigoSolicitacao?: string;
  seuNumero?: string;
  dataEmissao?: string;
  dataVencimento?: string;
  valorNominal?: number;
  tipoCobranca?: string;
  situacao?: string;
  dataSituacao?: string;
  valorTotalRecebido?: string;
  origemRecebimento?: string;
  arquivada?: boolean;
  numDiasAgenda?: number;
  descontos?: InterCobrancaDescontoDto[];
  multa?: InterCobrancaMultaDto;
  mora?: InterCobrancaMoraDto;
  pagador?: InterPagadorDto;
};

/**
 * Shape do GET /cobrancas/{codigoSolicitacao} conforme documentação Inter.
 */
export type InterCobrancaDetalheDto = {
  cobranca?: InterCobrancaDadosDto;
  boleto?: InterCobrancaBoletoDto;
  pix?: InterCobrancaPixDto;
  notaFiscal?: InterCobrancaNotaFiscalDto;
};

/**
 * Shape do GET /cobrancas/{codigoSolicitacao}/pdf conforme documentação Inter.
 */
export type InterCobrancaPdfResponseDto = {
  pdf?: string;
};

/**
 * Item de GET /cobrancas (listagem). Pode vir aninhado (cobranca/boleto/pix)
 * ou flat (campos da cobrança na raiz + boleto/pix).
 */
export type InterCobrancaListItemDto = InterCobrancaDetalheDto & InterCobrancaDadosDto;

/**
 * Shape do GET /cobrancas (pesquisaCobranca) conforme documentação Inter.
 */
export type InterCobrancaListResponseDto = {
  totalPaginas?: number;
  totalElementos?: number;
  tamanhoPagina?: number;
  primeiraPagina?: boolean;
  ultimaPagina?: boolean;
  numeroDeElementos?: number;
  cobrancas?: InterCobrancaListItemDto[];
};
