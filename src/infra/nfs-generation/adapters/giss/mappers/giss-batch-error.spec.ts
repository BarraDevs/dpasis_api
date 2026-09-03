import { NfsBatchErrorKind } from '../../../dtos/nfs-batch-status.dto';
import { toNfsBatchErrorDto } from './giss-batch-error';

describe('toNfsBatchErrorDto - Unit tests', () => {
  it('should be defined', () => {
    expect(toNfsBatchErrorDto).toBeDefined();
  });

  it.each(['E10', 'E71', 'A12'])('should classify GISS code %s as AlreadySubmitted', (code) => {
    // Act
    const result = toNfsBatchErrorDto({
      Codigo: code,
      Mensagem: 'RPS duplicado',
      IdentificacaoRps: { Numero: 7, Serie: 'NFSE' },
    });

    // Assert
    expect(result).toEqual({
      code,
      message: 'RPS duplicado',
      kind: NfsBatchErrorKind.AlreadySubmitted,
      rpsNumber: 7,
      rpsSeries: 'NFSE',
    });
  });

  it('should classify unknown codes as BusinessRejection', () => {
    // Act
    const result = toNfsBatchErrorDto({
      Codigo: 'E202',
      Mensagem: 'Código de tributação não informado',
    });

    // Assert
    expect(result.kind).toBe(NfsBatchErrorKind.BusinessRejection);
    expect(result.code).toBe('E202');
    expect(result.rpsNumber).toBeUndefined();
    expect(result.rpsSeries).toBeUndefined();
  });

  it('should omit RPS identification when includeRpsIdentification is false', () => {
    // Act
    const result = toNfsBatchErrorDto({
      Codigo: 'E99',
      Mensagem: 'Erro geral',
      IdentificacaoRps: { Numero: 7, Serie: 'NFSE' },
    }, { includeRpsIdentification: false });

    // Assert
    expect(result).toEqual({
      code: 'E99',
      message: 'Erro geral',
      kind: NfsBatchErrorKind.BusinessRejection,
      rpsNumber: undefined,
      rpsSeries: undefined,
    });
  });

  it('should coerce Codigo and Mensagem to empty string when missing', () => {
    // Act
    const result = toNfsBatchErrorDto({});

    // Assert
    expect(result).toEqual({
      code: '',
      message: '',
      kind: NfsBatchErrorKind.BusinessRejection,
      rpsNumber: undefined,
      rpsSeries: undefined,
    });
  });

  it('should coerce Numero to number and Serie to string', () => {
    // Act
    const result = toNfsBatchErrorDto({
      Codigo: 'E01',
      Mensagem: 'x',
      IdentificacaoRps: { Numero: '42', Serie: 1 },
    });

    // Assert
    expect(result.rpsNumber).toBe(42);
    expect(result.rpsSeries).toBe('1');
  });
});
