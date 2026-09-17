import { extractInterCobrancaRequestCodes } from './extract-inter-cobranca-request-codes';

function makeValidBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    codigoSolicitacao: 'req-1',
    ...overrides,
  };
}

describe('extractInterCobrancaRequestCodes - Unit tests', () => {
  let sut: typeof extractInterCobrancaRequestCodes;

  beforeEach(() => {
    sut = extractInterCobrancaRequestCodes;
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should extract codigoSolicitacao from a single object', () => {
    // Arrange
    const body = makeValidBody();

    // Act
    const result = sut(body);

    // Assert
    expect(result).toEqual(['req-1']);
  });

  it('should extract codigoSolicitacao from an array', () => {
    // Arrange
    const body = [
      makeValidBody(),
      makeValidBody({ codigoSolicitacao: 'req-2' }),
    ];

    // Act
    const result = sut(body);

    // Assert
    expect(result).toEqual(['req-1', 'req-2']);
  });

  it('should extract nested codigoSolicitacao from cobranca and trim it', () => {
    // Arrange
    const body = { cobranca: { codigoSolicitacao: ' nested-1 ' } };

    // Act
    const result = sut(body);

    // Assert
    expect(result).toEqual(['nested-1']);
  });

  it('should flatten a cobrancas wrapper with mixed shapes', () => {
    // Arrange
    const body = {
      cobrancas: [
        makeValidBody(),
        { cobranca: { codigoSolicitacao: 'req-2' } },
      ],
    };

    // Act
    const result = sut(body);

    // Assert
    expect(result).toEqual(['req-1', 'req-2']);
  });

  it('should drop duplicates and blank codes', () => {
    // Arrange
    const body = [
      makeValidBody(),
      makeValidBody(),
      makeValidBody({ codigoSolicitacao: '   ' }),
      { situacao: 'PAGO' },
    ];

    // Act
    const result = sut(body);

    // Assert
    expect(result).toEqual(['req-1']);
  });

  it.each([
    null,
    undefined,
    'pago',
    0,
    1,
    true,
    false,
  ])('should return an empty list for invalid body (%s)', (body: unknown) => {
    // Act
    const result = sut(body);

    // Assert
    expect(result).toEqual([]);
  });

  it('should return an empty list for an empty array', () => {
    // Act
    const result = sut([]);

    // Assert
    expect(result).toEqual([]);
  });

  it('should return an empty list for an empty object', () => {
    // Act
    const result = sut({});

    // Assert
    expect(result).toEqual([]);
  });

  it('should return an empty list for an empty cobrancas wrapper', () => {
    // Arrange
    const body = { cobrancas: [] };

    // Act
    const result = sut(body);

    // Assert
    expect(result).toEqual([]);
  });

  it('should extract top-level code when cobrancas is not an array', () => {
    // Arrange
    const body = makeValidBody({ cobrancas: 'not-an-array' });

    // Act
    const result = sut(body);

    // Assert
    expect(result).toEqual(['req-1']);
  });

  it('should ignore top-level code when cobrancas is an array', () => {
    // Arrange
    const body = {
      codigoSolicitacao: 'top-level',
      cobrancas: [makeValidBody({ codigoSolicitacao: 'inner' })],
    };

    // Act
    const result = sut(body);

    // Assert
    expect(result).toEqual(['inner']);
  });

  it('should skip primitive array items and keep valid codes', () => {
    // Arrange
    const body = [
      null,
      42,
      'pago',
      makeValidBody(),
    ];

    // Act
    const result = sut(body);

    // Assert
    expect(result).toEqual(['req-1']);
  });

  it('should ignore non-string codigoSolicitacao', () => {
    // Arrange
    const body = { codigoSolicitacao: 123 };

    // Act
    const result = sut(body);

    // Assert
    expect(result).toEqual([]);
  });

  it('should trim a direct codigoSolicitacao', () => {
    // Arrange
    const body = makeValidBody({ codigoSolicitacao: ' req-1 ' });

    // Act
    const result = sut(body);

    // Assert
    expect(result).toEqual(['req-1']);
  });

  it('should treat trimmed duplicates as the same code', () => {
    // Arrange
    const body = [
      makeValidBody(),
      makeValidBody({ codigoSolicitacao: ' req-1 ' }),
    ];

    // Act
    const result = sut(body);

    // Assert
    expect(result).toEqual(['req-1']);
  });

  it('should prefer a non-empty direct code over nested cobranca', () => {
    // Arrange
    const body = {
      codigoSolicitacao: 'direct',
      cobranca: { codigoSolicitacao: 'nested' },
    };

    // Act
    const result = sut(body);

    // Assert
    expect(result).toEqual(['direct']);
  });

  it('should fall through to nested cobranca when direct code is blank', () => {
    // Arrange
    const body = {
      codigoSolicitacao: '   ',
      cobranca: { codigoSolicitacao: 'nested' },
    };

    // Act
    const result = sut(body);

    // Assert
    expect(result).toEqual(['nested']);
  });

  it('should not flatten a cobranca array (one nesting level only)', () => {
    // Arrange
    const body = {
      cobranca: [
        { codigoSolicitacao: 'nested-in-array' },
      ],
    };

    // Act
    const result = sut(body);

    // Assert
    expect(result).toEqual([]);
  });

  it.each([null, 'pago'])('should ignore cobranca when it is not an object (%s)', (cobranca: unknown) => {
    // Arrange
    const body = { cobranca };

    // Act
    const result = sut(body);

    // Assert
    expect(result).toEqual([]);
  });

  it('should keep first-seen order of unique codes', () => {
    // Arrange
    const body = [
      makeValidBody({ codigoSolicitacao: 'req-a' }),
      makeValidBody({ codigoSolicitacao: 'req-b' }),
      makeValidBody({ codigoSolicitacao: 'req-a' }),
      makeValidBody({ codigoSolicitacao: 'req-c' }),
    ];

    // Act
    const result = sut(body);

    // Assert
    expect(result).toEqual(['req-a', 'req-b', 'req-c']);
  });

  it('should preserve accented characters in the request code', () => {
    // Arrange
    const body = makeValidBody({ codigoSolicitacao: 'solicitação-1' });

    // Act
    const result = sut(body);

    // Assert
    expect(result).toEqual(['solicitação-1']);
  });

  it('should drop a nested cobranca object without codigoSolicitacao', () => {
    // Arrange
    const body = { cobranca: { situacao: 'PAGO' } };

    // Act
    const result = sut(body);

    // Assert
    expect(result).toEqual([]);
  });

  it('should drop a code made only of whitespace', () => {
    // Arrange
    const body = makeValidBody({ codigoSolicitacao: '\t\n' });

    // Act
    const result = sut(body);

    // Assert
    expect(result).toEqual([]);
  });
});
