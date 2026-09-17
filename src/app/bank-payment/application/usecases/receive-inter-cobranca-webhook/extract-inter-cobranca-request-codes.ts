/**
 * O contrato do callback Bolepix v3 não é estável o bastante para whitelist: às vezes vem um
 * objeto, às vezes um array, e `codigoSolicitacao` pode estar aninhado em `cobranca`.
 */
export function extractInterCobrancaRequestCodes(body: unknown): string[] {
  const items = flattenCallbackItems(body);
  const codes: string[] = [];

  for (const item of items) {
    const code = requestCodeFromItem(item);
    if (code && !codes.includes(code)) {
      codes.push(code);
    }
  }

  return codes;
}

function flattenCallbackItems(body: unknown): unknown[] {
  if (Array.isArray(body)) {
    return body;
  }

  if (!body || typeof body !== 'object') {
    return [];
  }

  const record = body as Record<string, unknown>;
  if (Array.isArray(record.cobrancas)) {
    return record.cobrancas;
  }

  return [body];
}

function requestCodeFromItem(item: unknown): string | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const record = item as Record<string, unknown>;
  const direct = asNonEmptyString(record.codigoSolicitacao);
  if (direct) {
    return direct;
  }

  const nested = record.cobranca;
  if (nested && typeof nested === 'object') {
    return asNonEmptyString((nested as Record<string, unknown>).codigoSolicitacao);
  }

  return null;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
