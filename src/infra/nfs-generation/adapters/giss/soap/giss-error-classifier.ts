import { extractHttpStatus, GissSoapCallError } from './giss-soap-call.error';

/**
 * Falhas de rede que dizem "tente de novo", não "o pedido está errado". `ECONNABORTED` é o que o
 * axios usa para timeout.
 */
const TRANSIENT_NETWORK_CODES = new Set([
  'ECONNABORTED',
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EPIPE',
  'EAI_AGAIN',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ERR_NETWORK',
]);

const TRANSIENT_STATUSES = new Set([408, 425, 429]);

function unwrapCause(error: unknown): unknown {
  return error instanceof GissSoapCallError ? error.cause : error;
}

function resolveHttpStatus(error: unknown): number | null {
  if (error instanceof GissSoapCallError) {
    return error.trace.httpStatus ?? extractHttpStatus(error.cause);
  }
  return extractHttpStatus(error);
}

/**
 * O Giss não distingue indisponibilidade de recusa: até a Onda 3 tudo virava `ExternalApiError`, e a
 * fila gastava as cinco tentativas contra um 429 tanto quanto contra um XML inválido. A distinção é
 * a mesma já feita no Inter — status e código de rede —, com uma diferença importante: resposta que
 * o parser não entendeu **não** é transitória. O provedor respondeu; repetir devolve o mesmo XML.
 */
export function isTransientGissError(error: unknown): boolean {
  const status = resolveHttpStatus(error);
  if (status !== null) {
    return TRANSIENT_STATUSES.has(status) || status >= 500;
  }

  const code = (unwrapCause(error) as { code?: unknown })?.code;
  return typeof code === 'string' && TRANSIENT_NETWORK_CODES.has(code);
}

/** `Retry-After` em segundos, quando o provedor disse quando voltar. */
export function extractGissRetryAfterSeconds(error: unknown): number | undefined {
  const headers = (unwrapCause(error) as { response?: { headers?: Record<string, unknown> } })?.response?.headers;
  const raw = headers?.['retry-after'] ?? headers?.['Retry-After'];
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}
