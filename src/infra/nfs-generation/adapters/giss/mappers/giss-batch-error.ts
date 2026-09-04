import { NfsBatchErrorDto, NfsBatchErrorKind } from '../../../dtos/nfs-batch-status.dto';

/**
 * Códigos GISS que significam "o provedor já conhece este RPS" — a nota provavelmente existe.
 * `E10` (RPS já informado), `E71` (RPS em duplicidade no arquivo), `A12` (RPS duplicado ignorado).
 * Reenviar às cegas depois de um destes é o caminho para uma segunda nota.
 */
const GISS_ALREADY_SUBMITTED_CODES = new Set(['E10', 'E71', 'A12']);

/**
 * Códigos que significam "não achei nada" — resposta legítima de consulta, nunca falha:
 *
 * - `E89` — "Não existe na base de dados uma NFS-e emitida para o número de RPS informado". É o que
 *   `ConsultarNfsePorRps` devolve para um RPS desconhecido; medido contra a produção de Mauá.
 * - `E212` — "NFS-e não encontrada". Sai na consulta por número/período, e é como o provedor
 *   sinaliza a página seguinte à última: um laço que trate `ListaMensagemRetorno` como erro quebra
 *   no fim de toda paginação.
 *
 * Classificar qualquer um dos dois como rejeição de negócio é o erro caro: a reconciliação marcaria
 * `REJECTED` — terminal — uma nota que o provedor apenas ainda não conhece.
 */
const GISS_NOT_FOUND_CODES = new Set(['E89', 'E212']);

/**
 * `Codigo` nem sempre traz o código real: em várias respostas o Giss devolve `V999` genérico e põe
 * o código de verdade dentro de `Mensagem` (medido em produção — §9, RRR2 da auditoria). Ler só o
 * `Codigo` faz `E212` passar por erro desconhecido.
 */
const GISS_GENERIC_CODES = new Set(['', 'V999']);
const GISS_CODE_IN_MESSAGE_PATTERN = /\b([AEae]\d{1,4})\b/;

export function resolveGissCode(mensagem: GissMensagemRetorno): string {
  const declared = String(mensagem?.Codigo ?? '').trim();

  if (!GISS_GENERIC_CODES.has(declared.toUpperCase())) {
    return declared;
  }

  const embedded = GISS_CODE_IN_MESSAGE_PATTERN.exec(String(mensagem?.Mensagem ?? ''));
  return embedded ? embedded[1].toUpperCase() : declared;
}

export type GissMensagemRetorno = {
  Codigo?: unknown;
  Mensagem?: unknown;
  IdentificacaoRps?: {
    Numero?: unknown;
    Serie?: unknown;
  };
};

function resolveKind(code: string): NfsBatchErrorKind {
  if (GISS_ALREADY_SUBMITTED_CODES.has(code)) {
    return NfsBatchErrorKind.AlreadySubmitted;
  }
  if (GISS_NOT_FOUND_CODES.has(code)) {
    return NfsBatchErrorKind.NotFound;
  }
  return NfsBatchErrorKind.BusinessRejection;
}

export function toNfsBatchErrorDto(
  mensagem: GissMensagemRetorno,
  options: { includeRpsIdentification?: boolean } = {},
): NfsBatchErrorDto {
  const includeRps = options.includeRpsIdentification !== false;
  const code = resolveGissCode(mensagem);

  return {
    code,
    message: String(mensagem?.Mensagem ?? ''),
    kind: resolveKind(code),
    rpsNumber: includeRps && mensagem?.IdentificacaoRps?.Numero !== undefined
      ? Number(mensagem.IdentificacaoRps.Numero)
      : undefined,
    rpsSeries: includeRps && mensagem?.IdentificacaoRps?.Serie !== undefined
      ? String(mensagem.IdentificacaoRps.Serie)
      : undefined,
  };
}
