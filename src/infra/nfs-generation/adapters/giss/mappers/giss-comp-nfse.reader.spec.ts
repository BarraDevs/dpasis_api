import { toNfsIssuedNoteDto, toNfsIssuedNoteListingDto } from './giss-comp-nfse.reader';

function makeComp(overrides: Record<string, unknown> = {}): any {
  return {
    Nfse: {
      InfNfse: {
        Numero: '9041',
        CodigoVerificacao: 'ABC123',
        DataEmissao: '2026-09-03T10:00:00',
        ValoresNfse: { ValorLiquidoNfse: '1425.48' },
        DeclaracaoPrestacaoServico: {
          InfDeclaracaoPrestacaoServico: {
            Rps: { IdentificacaoRps: { Numero: 41, Serie: 'NFSE' } },
            Competencia: '2026-09-01',
            Servico: {
              Valores: { ValorServicos: '1500.50' },
              Discriminacao: 'Manutenção predial mensal',
            },
            TomadorServico: {
              IdentificacaoTomador: { CpfCnpj: { Cnpj: '12345678000199' } },
              RazaoSocial: 'Cliente Exemplo LTDA',
            },
          },
        },
      },
    },
    ...overrides,
  };
}

describe('giss-comp-nfse.reader - Unit tests', () => {
  let sut: typeof toNfsIssuedNoteListingDto;

  beforeEach(() => {
    sut = toNfsIssuedNoteListingDto;
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should keep the thin identity mapper without listing fields', () => {
    // Act
    const result = toNfsIssuedNoteDto(makeComp());

    // Assert
    expect(result).toEqual({
      rpsNumber: 41,
      rpsSeries: 'NFSE',
      nfseNumber: '9041',
      verificationCode: 'ABC123',
      issueDate: '2026-09-03T10:00:00',
    });
  });

  it('should map tomador CNPJ, valores and leave canceled false when NfseCancelamento is absent', () => {
    // Act
    const result = sut(makeComp());

    // Assert
    expect(result).toEqual({
      rpsNumber: 41,
      rpsSeries: 'NFSE',
      nfseNumber: '9041',
      verificationCode: 'ABC123',
      issueDate: '2026-09-03T10:00:00',
      competence: '2026-09-01',
      takerDocument: '12345678000199',
      takerName: 'Cliente Exemplo LTDA',
      servicesValue: 1500.5,
      netValue: 1425.48,
      description: 'Manutenção predial mensal',
      canceled: false,
      cancellationDate: null,
      cancellationReasonCode: null,
    });
  });

  it('should prefer Cpf when the tomador is a natural person', () => {
    // Arrange
    const comp = makeComp();
    comp.Nfse.InfNfse.DeclaracaoPrestacaoServico.InfDeclaracaoPrestacaoServico.TomadorServico = {
      IdentificacaoTomador: { CpfCnpj: { Cpf: '12345678901' } },
      RazaoSocial: 'João da Silva',
    };

    // Act
    const result = sut(comp);

    // Assert
    expect(result.takerDocument).toBe('12345678901');
    expect(result.takerName).toBe('João da Silva');
  });

  it('should mark canceled from NfseCancelamento sibling of Nfse', () => {
    // Arrange
    const comp = makeComp({
      NfseCancelamento: {
        Confirmacao: {
          Pedido: { InfPedidoCancelamento: { CodigoCancelamento: '2' } },
          DataHora: '2026-09-10T12:00:00',
        },
      },
    });

    // Act
    const result = sut(comp);

    // Assert
    expect(result.canceled).toBe(true);
    expect(result.cancellationDate).toBe('2026-09-10T12:00:00');
    expect(result.cancellationReasonCode).toBe('2');
  });

  it('should use nulls when optional CompNfse branches are missing', () => {
    // Arrange
    const comp = {
      Nfse: {
        InfNfse: {
          Numero: '1',
          CodigoVerificacao: 'X',
          DataEmissao: '2026-01-01T00:00:00',
          DeclaracaoPrestacaoServico: {
            InfDeclaracaoPrestacaoServico: {
              Rps: { IdentificacaoRps: { Numero: 1, Serie: 'A' } },
            },
          },
        },
      },
    };

    // Act
    const result = sut(comp);

    // Assert
    expect(result).toMatchObject({
      competence: null,
      takerDocument: null,
      takerName: null,
      servicesValue: null,
      netValue: null,
      description: null,
      canceled: false,
      cancellationDate: null,
      cancellationReasonCode: null,
    });
  });
});
