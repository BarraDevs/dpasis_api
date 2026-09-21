import { NfsIssuedNoteListingDto } from '../../../dtos/list-issued-nfs.dto';
import { NfsIssuedNoteDto } from '../../../dtos/nfs-batch-status.dto';

function optionalString(value: unknown): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return String(value);
}

function optionalNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractCpfCnpj(cpfCnpj: { Cpf?: unknown; Cnpj?: unknown } | undefined): string | null {
  return optionalString(cpfCnpj?.Cnpj ?? cpfCnpj?.Cpf);
}

/**
 * Travessia do `CompNfse` do ABRASF 2.04, compartilhada por todas as respostas que devolvem notas:
 * consulta de lote, consulta por RPS e consulta por período. A estrutura é a mesma em todas —
 * `CompNfse/Nfse/InfNfse` para a identidade da nota e
 * `InfNfse/DeclaracaoPrestacaoServico/InfDeclaracaoPrestacaoServico/Rps/IdentificacaoRps` para a
 * chave natural do RPS, que é o que permite casar a nota do provedor com a nota local.
 */
export function toNfsIssuedNoteDto(comp: any): NfsIssuedNoteDto {
  const infNfse = comp?.Nfse?.InfNfse;
  const identificacaoRps = infNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico?.Rps?.IdentificacaoRps;

  return {
    rpsNumber: Number(identificacaoRps?.Numero ?? 0),
    rpsSeries: String(identificacaoRps?.Serie ?? ''),
    nfseNumber: String(infNfse?.Numero ?? ''),
    verificationCode: String(infNfse?.CodigoVerificacao ?? ''),
    issueDate: String(infNfse?.DataEmissao ?? ''),
  };
}

/**
 * Mesma identidade de `toNfsIssuedNoteDto`, mais tomador/valores/cancelamento da consulta por período.
 * `NfseCancelamento` é irmão de `Nfse` dentro de `CompNfse`, não filho de `InfNfse`.
 */
export function toNfsIssuedNoteListingDto(comp: any): NfsIssuedNoteListingDto {
  const identity = toNfsIssuedNoteDto(comp);
  const infDeclaracao = comp?.Nfse?.InfNfse?.DeclaracaoPrestacaoServico?.InfDeclaracaoPrestacaoServico;
  const tomador = infDeclaracao?.TomadorServico;
  const cancelamento = comp?.NfseCancelamento;
  const confirmacao = cancelamento?.Confirmacao;

  return {
    ...identity,
    competence: optionalString(infDeclaracao?.Competencia),
    takerDocument: extractCpfCnpj(tomador?.IdentificacaoTomador?.CpfCnpj),
    takerName: optionalString(tomador?.RazaoSocial),
    servicesValue: optionalNumber(infDeclaracao?.Servico?.Valores?.ValorServicos),
    netValue: optionalNumber(comp?.Nfse?.InfNfse?.ValoresNfse?.ValorLiquidoNfse),
    description: optionalString(infDeclaracao?.Servico?.Discriminacao),
    canceled: cancelamento !== undefined && cancelamento !== null && cancelamento !== '',
    cancellationDate: optionalString(confirmacao?.DataHora),
    cancellationReasonCode: optionalString(confirmacao?.Pedido?.InfPedidoCancelamento?.CodigoCancelamento),
  };
}
