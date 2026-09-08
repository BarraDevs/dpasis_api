import { extractGissRetryAfterSeconds, isTransientGissError } from './giss-error-classifier';
import { GissSoapCallError } from './giss-soap-call.error';

function makeSoapCallError(cause: unknown, httpStatus: number | null): GissSoapCallError {
  return new GissSoapCallError(cause, {
    requestBody: '<xml/>',
    responseBody: null,
    httpStatus,
    durationMs: 10,
  });
}

function makeAxiosError(status: number | null, headers: Record<string, string> = {}, code?: string): Error {
  const error = new Error('falha na chamada') as Error & { response?: unknown; code?: string };
  if (status !== null) {
    error.response = { status, headers };
  }
  if (code) {
    error.code = code;
  }
  return error;
}

describe('isTransientGissError', () => {
  it.each([408, 425, 429, 500, 502, 503, 504])('should treat HTTP %s as transient', (status) => {
    // Act & Assert
    expect(isTransientGissError(makeSoapCallError(makeAxiosError(status), status))).toBe(true);
  });

  it.each([400, 401, 403, 404, 422])('should treat HTTP %s as permanent for the queue', (status) => {
    // Act & Assert
    expect(isTransientGissError(makeSoapCallError(makeAxiosError(status), status))).toBe(false);
  });

  it.each(['ECONNABORTED', 'ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EAI_AGAIN'])(
    'should treat network failure %s as transient',
    (code) => {
      // Act & Assert
      expect(isTransientGissError(makeSoapCallError(makeAxiosError(null, {}, code), null))).toBe(true);
    },
  );

  it('should not treat an unparseable response as transient', () => {
    // Arrange — o Giss respondeu; repetir devolve o mesmo XML.
    const parseError = new Error('Resposta inesperada do Giss: elemento outputXML não encontrado');

    // Act & Assert
    expect(isTransientGissError(makeSoapCallError(parseError, null))).toBe(false);
  });

  it('should classify a bare axios error, without the SOAP wrapper', () => {
    // Act & Assert
    expect(isTransientGissError(makeAxiosError(503))).toBe(true);
    expect(isTransientGissError(makeAxiosError(400))).toBe(false);
  });
});

describe('extractGissRetryAfterSeconds', () => {
  it('should read Retry-After when the provider says when to come back', () => {
    // Arrange
    const error = makeSoapCallError(makeAxiosError(429, { 'retry-after': '120' }), 429);

    // Act & Assert
    expect(extractGissRetryAfterSeconds(error)).toBe(120);
  });

  it('should return undefined when the header is absent or not a positive number', () => {
    // Act & Assert
    expect(extractGissRetryAfterSeconds(makeSoapCallError(makeAxiosError(429), 429))).toBeUndefined();
    expect(extractGissRetryAfterSeconds(makeSoapCallError(makeAxiosError(429, { 'retry-after': 'Wed, 21 Oct 2026 07:28:00 GMT' }), 429))).toBeUndefined();
  });
});
