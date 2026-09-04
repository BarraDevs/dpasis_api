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
  describe('resolução do código real (RRR2)', () => {
    it('should classify E89 as NotFound', () => {
      // Arrange — tabela oficial: "Não existe na base de dados uma NFS-e emitida para o número de
      // RPS informado". É a resposta de `ConsultarNfsePorRps` para RPS desconhecido, medida em
      // produção. Classificar como rejeição marcaria `REJECTED` uma nota que só ainda não existe.
      // Act
      const result = toNfsBatchErrorDto({ Codigo: 'E89', Mensagem: 'E89' });

      // Assert
      expect(result.kind).toBe(NfsBatchErrorKind.NotFound);
    });

    it('should classify E212 as NotFound', () => {
      // Act
      const result = toNfsBatchErrorDto({ Codigo: 'E212', Mensagem: 'NFS-e não encontrada' });

      // Assert
      expect(result.kind).toBe(NfsBatchErrorKind.NotFound);
    });

    it('should read the real code from Mensagem when Codigo is the generic V999', () => {
      // Arrange — medido em produção: o Giss devolve V999 e põe o código real na mensagem.
      // Act
      const result = toNfsBatchErrorDto({ Codigo: 'V999', Mensagem: 'E212 - NFS-e não encontrada' });

      // Assert
      expect(result.code).toBe('E212');
      expect(result.kind).toBe(NfsBatchErrorKind.NotFound);
    });

    it('should read the real code from Mensagem when Codigo is empty', () => {
      // Act
      const result = toNfsBatchErrorDto({ Codigo: '', Mensagem: 'E10 RPS já informado.' });

      // Assert
      expect(result.code).toBe('E10');
      expect(result.kind).toBe(NfsBatchErrorKind.AlreadySubmitted);
    });

    it('should keep the generic code when the message carries no recognisable one', () => {
      // Act
      const result = toNfsBatchErrorDto({ Codigo: 'V999', Mensagem: 'Erro interno' });

      // Assert
      expect(result.code).toBe('V999');
      expect(result.kind).toBe(NfsBatchErrorKind.BusinessRejection);
    });

    it('should not override a specific code with something found in the message', () => {
      // Act
      const result = toNfsBatchErrorDto({ Codigo: 'E163', Mensagem: 'ver também E212' });

      // Assert
      expect(result.code).toBe('E163');
      expect(result.kind).toBe(NfsBatchErrorKind.BusinessRejection);
    });
  });
});
