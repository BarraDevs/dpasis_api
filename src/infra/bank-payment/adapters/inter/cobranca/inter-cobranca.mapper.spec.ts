import { BankPaymentPersonType } from '../../../enums/bank-payment-person-type.enum';
import { BankPaymentProvider } from '../../../enums/bank-payment-provider.enum';
import { BankPaymentStatus } from '../../../enums/bank-payment-status.enum';
import { InterCobrancaMapper } from './inter-cobranca.mapper';


describe('InterCobrancaMapper - Unit tests', () => {
  it('should be defined', () => {
    expect(InterCobrancaMapper).toBeDefined();
  });

  it('should map issue input to Inter request', () => {
    // Arrange
    const input = {
      provider: BankPaymentProvider.INTER,
      yourNumber: 'INV-1',
      amount: 150.5,
      dueDate: '2026-09-01',
      daysAfterDue: 30,
      payer: {
        document: '11122233344',
        personType: BankPaymentPersonType.INDIVIDUAL,
        name: 'João',
        email: 'a@b.com',
        areaCode: '11',
        phone: '999999999',
        street: 'Rua A',
        number: '10',
        complement: 'ap 1',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01001000',
      },
    };

    // Act
    const result = InterCobrancaMapper.toIssueRequest(input);

    // Assert
    expect(result).toEqual({
      seuNumero: 'INV-1',
      valorNominal: 150.5,
      dataVencimento: '2026-09-01',
      numDiasAgenda: 30,
      pagador: {
        cpfCnpj: '11122233344',
        tipoPessoa: 'FISICA',
        nome: 'João',
        email: 'a@b.com',
        ddd: '11',
        telefone: '999999999',
        endereco: 'Rua A',
        numero: '10',
        complemento: 'ap 1',
        bairro: 'Centro',
        cidade: 'São Paulo',
        uf: 'SP',
        cep: '01001000',
      },
    });
  });

  it('should map cancel reason to Inter motivoCancelamento', () => {
    expect(InterCobrancaMapper.toCancelRequest({
      provider: BankPaymentProvider.INTER,
      requestCode: 'abc',
      reason: 'Cliente pediu o cancelamento',
    })).toEqual({ motivoCancelamento: 'Cliente pediu o cancelamento' });
  });

  it('should map Inter detail response to BankPaymentDto', () => {
    // Act
    const result = InterCobrancaMapper.toBankPaymentDto('req-1', {
      cobranca: {
        codigoSolicitacao: 'req-1',
        seuNumero: 'INV-1',
        situacao: 'A_RECEBER',
        valorNominal: 10,
        dataVencimento: '2026-09-01',
        numDiasAgenda: 5,
        pagador: {
          cpfCnpj: '123',
          tipoPessoa: 'JURIDICA',
          nome: 'Empresa',
        },
      },
      boleto: {
        nossoNumero: '1',
        codigoBarras: 'bar',
        linhaDigitavel: 'line',
      },
      pix: {
        txid: 'tx',
        pixCopiaECola: 'pix-copy',
      },
    });

    // Assert
    expect(result).toEqual({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-1',
      yourNumber: 'INV-1',
      status: BankPaymentStatus.EMITTED,
      amount: 10,
      dueDate: '2026-09-01',
      daysAfterDue: 5,
      payer: {
        document: '123',
        personType: BankPaymentPersonType.COMPANY,
        name: 'Empresa',
        email: undefined,
        areaCode: undefined,
        phone: undefined,
        street: undefined,
        number: undefined,
        complement: undefined,
        neighborhood: undefined,
        city: undefined,
        state: undefined,
        zipCode: undefined,
      },
      boleto: {
        ourNumber: '1',
        barcode: 'bar',
        digitableLine: 'line',
      },
      pix: {
        txid: 'tx',
        copyAndPaste: 'pix-copy',
      },
    });
  });

  it('should map nested cobranca payload and unknown situacao', () => {
    const result = InterCobrancaMapper.toBankPaymentDto('fallback', {
      cobranca: {
        codigoSolicitacao: 'nested',
        seuNumero: 'X',
        situacao: 'ALGO_NOVO',
        valorNominal: 1,
        dataVencimento: '2026-01-01',
        pagador: {
          cpfCnpj: '1',
          tipoPessoa: 'FISICA',
          nome: 'A',
        },
      },
    });

    expect(result.requestCode).toBe('nested');
    expect(result.status).toBe(BankPaymentStatus.UNKNOWN);
  });

  it('should fallback requestCode when cobranca block is missing', () => {
    const result = InterCobrancaMapper.toBankPaymentDto('fallback-code', {});

    expect(result.requestCode).toBe('fallback-code');
    expect(result.yourNumber).toBe('');
    expect(result.status).toBe(BankPaymentStatus.UNKNOWN);
  });
});
