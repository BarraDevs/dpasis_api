import {
  extractHttpStatus,
  extractResponseBody,
  GissSoapCallError,
} from './giss-soap-call.error';

describe('GissSoapCallError - Unit tests', () => {
  it('should be defined', () => {
    expect(GissSoapCallError).toBeDefined();
  });

  describe('unwrap', () => {
    it('should return the original cause when the error is a GissSoapCallError', () => {
      // Arrange
      const cause = new Error('timeout');
      const wrapped = new GissSoapCallError(cause, {
        requestBody: '<envelope/>',
        responseBody: null,
        httpStatus: null,
        durationMs: 5,
      });

      // Act & Assert
      expect(GissSoapCallError.unwrap(wrapped)).toBe(cause);
    });

    it('should return the value unchanged when it is not a GissSoapCallError', () => {
      // Arrange
      const error = new Error('plain');

      // Act & Assert
      expect(GissSoapCallError.unwrap(error)).toBe(error);
      expect(GissSoapCallError.unwrap('texto')).toBe('texto');
    });
  });

  describe('extractHttpStatus', () => {
    it('should return null when response status is absent', () => {
      expect(extractHttpStatus(new Error('boom'))).toBeNull();
      expect(extractHttpStatus({ response: {} })).toBeNull();
    });

    it('should return the numeric HTTP status when present', () => {
      expect(extractHttpStatus({ response: { status: 503 } })).toBe(503);
    });
  });

  describe('extractResponseBody', () => {
    it('should return null when response data is absent', () => {
      expect(extractResponseBody(new Error('boom'))).toBeNull();
      expect(extractResponseBody({ response: {} })).toBeNull();
      expect(extractResponseBody({ response: { data: null } })).toBeNull();
    });

    it('should return the string body as-is', () => {
      expect(extractResponseBody({ response: { data: '<fault/>' } })).toBe('<fault/>');
    });

    it('should JSON-stringify non-string response bodies', () => {
      expect(extractResponseBody({ response: { data: { code: 'E1' } } })).toBe('{"code":"E1"}');
    });
  });
});
