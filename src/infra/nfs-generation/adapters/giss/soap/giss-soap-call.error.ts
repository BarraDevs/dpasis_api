export type GissSoapCallTrace = {
  requestBody: string;
  responseBody: string | null;
  httpStatus: number | null;
  durationMs: number;
};

export type GissSoapCallResult = GissSoapCallTrace & {
  outputXml: string;
};

/** Envelopa a causa original preservando `message`, para não mudar o que o gateway já classifica. */
export class GissSoapCallError extends Error {
  constructor(public readonly cause: unknown, public readonly trace: GissSoapCallTrace) {
    super(cause instanceof Error ? cause.message : String(cause));
    this.name = 'GissSoapCallError';
  }

  /** Devolve a causa original, para que a classificação de erro do gateway não mude de forma. */
  static unwrap(error: unknown): unknown {
    return error instanceof GissSoapCallError ? error.cause : error;
  }
}

export function extractHttpStatus(error: unknown): number | null {
  const status = (error as { response?: { status?: unknown } })?.response?.status;
  return typeof status === 'number' ? status : null;
}

export function extractResponseBody(error: unknown): string | null {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (data === undefined || data === null) {
    return null;
  }
  return typeof data === 'string' ? data : JSON.stringify(data);
}
