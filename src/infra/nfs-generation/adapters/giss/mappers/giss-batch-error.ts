import { NfsBatchErrorDto, NfsBatchErrorKind } from '../../../dtos/nfs-batch-status.dto';

/**
 * Códigos GISS que significam "o provedor já conhece este RPS" — a nota provavelmente existe.
 * `E10` (RPS já informado), `E71` (RPS em duplicidade no arquivo), `A12` (RPS duplicado ignorado).
 * Reenviar às cegas depois de um destes é o caminho para uma segunda nota.
 */
const GISS_ALREADY_SUBMITTED_CODES = new Set(['E10', 'E71', 'A12']);

export type GissMensagemRetorno = {
  Codigo?: unknown;
  Mensagem?: unknown;
  IdentificacaoRps?: {
    Numero?: unknown;
    Serie?: unknown;
  };
};

export function toNfsBatchErrorDto(
  mensagem: GissMensagemRetorno,
  options: { includeRpsIdentification?: boolean } = {},
): NfsBatchErrorDto {
  const includeRps = options.includeRpsIdentification !== false;
  const code = String(mensagem?.Codigo ?? '');

  return {
    code,
    message: String(mensagem?.Mensagem ?? ''),
    kind: GISS_ALREADY_SUBMITTED_CODES.has(code)
      ? NfsBatchErrorKind.AlreadySubmitted
      : NfsBatchErrorKind.BusinessRejection,
    rpsNumber: includeRps && mensagem?.IdentificacaoRps?.Numero !== undefined
      ? Number(mensagem.IdentificacaoRps.Numero)
      : undefined,
    rpsSeries: includeRps && mensagem?.IdentificacaoRps?.Serie !== undefined
      ? String(mensagem.IdentificacaoRps.Serie)
      : undefined,
  };
}
