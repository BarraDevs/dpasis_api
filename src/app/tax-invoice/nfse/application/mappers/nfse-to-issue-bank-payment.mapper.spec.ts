import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { AppException } from 'src/core/filters/app.exception';
import { BankPaymentPersonType } from 'src/infra/bank-payment/enums/bank-payment-person-type.enum';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import type { NfseBankPaymentSnapshot, NfseIssueSnapshot } from '../usecases/issue-nfse/issue-nfse.service';
import { NfseToIssueBankPaymentMapper } from './nfse-to-issue-bank-payment.mapper';

function makeBankPayment(overrides: Partial<NfseBankPaymentSnapshot> = {}): NfseBankPaymentSnapshot {
  return {
    invoiceType: ClientInvoiceConfigType.MONTHLY,
    dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
    dueDateDay: 15,
    dueMonth: null,
    deadlineDays: null,
    referenceMonth: 8,
    referenceYear: 2026,
    ...overrides,
  };
}

function makeSnapshot(overrides: Partial<NfseIssueSnapshot> = {}): NfseIssueSnapshot {
  return {
    input: {
      companyId: 1,
      clientId: 1,
      simpleNationalOptant: false,
      fiscalIncentive: false,
      service: {
        serviceListItemCode: '01.07',
        nbsCode: '1.1501.30.00',
        indopCode: '050101',
        description: 'Serviço',
        serviceMunicipalCodeIbge: '3529401',
        issExigibility: 1,
        issWithheld: false,
        servicesValue: 1500.5,
      },
    },
    providerDocument: '12345678000199',
    providerMunicipalRegistration: '12345',
    clientDocument: '11122233344',
    clientCompanyName: 'Cliente PF',
    clientType: ClientType.PF,
    takerAddress: {
      street: 'Rua A',
      number: '10',
      complement: null,
      neighborhood: 'Centro',
      city: 'São Paulo',
      cityCodeIbge: '3550308',
      state: 'SP',
      zipCode: '01310-100',
    },
    bankPayment: makeBankPayment(),
    ...overrides,
  };
}

describe('NfseToIssueBankPaymentMapper - Unit tests', () => {
  it('should map monthly DUE_DATE using reference month/year and clamp invalid day', () => {
    // Arrange
    const snapshot = makeSnapshot({
      bankPayment: makeBankPayment({
        invoiceType: ClientInvoiceConfigType.MONTHLY,
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 31,
        referenceMonth: 2,
        referenceYear: 2026,
      }),
    });

    // Act
    const result = NfseToIssueBankPaymentMapper.toIssueBankPaymentInput({
      nfseId: 42,
      issuedAt: new Date('2026-02-10T12:00:00-03:00'),
      snapshot,
    });

    // Assert
    expect(result).toMatchObject({
      provider: BankPaymentProvider.INTER,
      yourNumber: '42',
      amount: 1500.5,
      dueDate: '2026-02-28',
      daysAfterDue: 30,
      payer: {
        document: '11122233344',
        personType: BankPaymentPersonType.INDIVIDUAL,
        name: 'Cliente PF',
        city: 'São Paulo',
        zipCode: '01310100',
      },
    });
  });

  it('should map annual DUE_DATE using dueMonth', () => {
    // Arrange
    const snapshot = makeSnapshot({
      bankPayment: makeBankPayment({
        invoiceType: ClientInvoiceConfigType.ANNUAL,
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 10,
        dueMonth: 12,
        referenceMonth: 8,
        referenceYear: 2026,
      }),
    });

    // Act
    const result = NfseToIssueBankPaymentMapper.toIssueBankPaymentInput({
      nfseId: 7,
      issuedAt: new Date('2026-08-01T12:00:00-03:00'),
      snapshot,
    });

    // Assert
    expect(result.dueDate).toBe('2026-12-10');
  });

  it('should map DEADLINE from issuedAt + deadlineDays', () => {
    // Arrange
    const snapshot = makeSnapshot({
      bankPayment: makeBankPayment({
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: 5,
      }),
    });

    // Act
    const result = NfseToIssueBankPaymentMapper.toIssueBankPaymentInput({
      nfseId: 7,
      issuedAt: new Date('2026-08-20T15:00:00-03:00'),
      snapshot,
    });

    // Assert
    expect(result.dueDate).toBe('2026-08-25');
  });

  it('should map PJ client as COMPANY person type', () => {
    // Arrange
    const snapshot = makeSnapshot({
      clientType: ClientType.PJ,
      clientCompanyName: 'Cliente LTDA',
      clientDocument: '12345678000199',
    });

    // Act
    const result = NfseToIssueBankPaymentMapper.toIssueBankPaymentInput({
      nfseId: 7,
      issuedAt: new Date('2026-08-20T15:00:00-03:00'),
      snapshot,
    });

    // Assert
    expect(result.payer.personType).toBe(BankPaymentPersonType.COMPANY);
    expect(result.payer.name).toBe('Cliente LTDA');
  });

  it('should throw AppException when bank payment context is missing', () => {
    // Arrange
    const snapshot = makeSnapshot({ bankPayment: undefined });

    // Act & Assert
    expect(() => NfseToIssueBankPaymentMapper.toIssueBankPaymentInput({
      nfseId: 7,
      issuedAt: new Date(),
      snapshot,
    })).toThrow(AppException);
    expect(() => NfseToIssueBankPaymentMapper.toIssueBankPaymentInput({
      nfseId: 7,
      issuedAt: new Date(),
      snapshot,
    })).toThrow('Contexto de boleto ausente na NFS-e.');
  });

  it.each([0, undefined])('should throw when servicesValue is invalid (%s)', (servicesValue) => {
    // Arrange
    const snapshot = makeSnapshot({
      input: {
        companyId: 1,
        clientId: 1,
        simpleNationalOptant: false,
        fiscalIncentive: false,
        service: {
          serviceListItemCode: '01.07',
          nbsCode: '1.1501.30.00',
          indopCode: '050101',
          description: 'Serviço',
          serviceMunicipalCodeIbge: '3529401',
          issExigibility: 1,
          issWithheld: false,
          servicesValue: servicesValue as number,
        },
      },
    });

    // Act & Assert
    expect(() => NfseToIssueBankPaymentMapper.toIssueBankPaymentInput({
      nfseId: 7,
      issuedAt: new Date(),
      snapshot,
    })).toThrow(AppException);
    expect(() => NfseToIssueBankPaymentMapper.toIssueBankPaymentInput({
      nfseId: 7,
      issuedAt: new Date(),
      snapshot,
    })).toThrow('Valor dos serviços inválido para emissão do boleto.');
  });

  it.each(['', '   '])('should throw when taker city is blank (%s)', (city) => {
    // Arrange
    const snapshot = makeSnapshot({
      takerAddress: {
        street: 'Rua A',
        number: '10',
        complement: null,
        neighborhood: 'Centro',
        city,
        cityCodeIbge: '3550308',
        state: 'SP',
        zipCode: '01310-100',
      },
    });

    // Act & Assert
    expect(() => NfseToIssueBankPaymentMapper.toIssueBankPaymentInput({
      nfseId: 7,
      issuedAt: new Date(),
      snapshot,
    })).toThrow(AppException);
    expect(() => NfseToIssueBankPaymentMapper.toIssueBankPaymentInput({
      nfseId: 7,
      issuedAt: new Date(),
      snapshot,
    })).toThrow('Cidade do tomador ausente para emissão do boleto.');
  });

  it('should use params.bankPayment when snapshot bankPayment is missing', () => {
    // Arrange
    const snapshot = makeSnapshot({ bankPayment: undefined });
    const bankPayment = makeBankPayment({
      dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
      dueDateDay: null,
      deadlineDays: 3,
    });

    // Act
    const result = NfseToIssueBankPaymentMapper.toIssueBankPaymentInput({
      nfseId: 7,
      issuedAt: new Date('2026-08-20T15:00:00-03:00'),
      snapshot,
      bankPayment,
    });

    // Assert
    expect(result.dueDate).toBe('2026-08-23');
  });

  it('should truncate yourNumber to 15 characters', () => {
    // Arrange
    const snapshot = makeSnapshot();
    const nfseId = 1_234_567_890_123_456;

    // Act
    const result = NfseToIssueBankPaymentMapper.toIssueBankPaymentInput({
      nfseId,
      issuedAt: new Date('2026-08-20T15:00:00-03:00'),
      snapshot,
    });

    // Assert
    expect(result.yourNumber).toBe(String(nfseId).slice(0, 15));
    expect(result.yourNumber).toHaveLength(15);
  });

  it('should map payer complement and strip non-digits from zipCode', () => {
    // Arrange
    const snapshot = makeSnapshot({
      takerAddress: {
        street: 'Rua A',
        number: '10',
        complement: 'Apto 12',
        neighborhood: 'Centro',
        city: 'São Paulo',
        cityCodeIbge: '3550308',
        state: 'SP',
        zipCode: '01310-100',
      },
    });

    // Act
    const result = NfseToIssueBankPaymentMapper.toIssueBankPaymentInput({
      nfseId: 7,
      issuedAt: new Date('2026-08-20T15:00:00-03:00'),
      snapshot,
    });

    // Assert
    expect(result.payer.complement).toBe('Apto 12');
    expect(result.payer.zipCode).toBe('01310100');
  });

  it('should propagate bank charges when provided', () => {
    // Arrange
    const snapshot = makeSnapshot();

    // Act
    const result = NfseToIssueBankPaymentMapper.toIssueBankPaymentInput({
      nfseId: 7,
      issuedAt: new Date('2026-08-20T15:00:00-03:00'),
      snapshot,
      fineRate: 2,
      moraRate: 1,
    });

    // Assert
    expect(result.fineRate).toBe(2);
    expect(result.moraRate).toBe(1);
  });

  it('should default charge fields to null when omitted', () => {
    // Arrange
    const snapshot = makeSnapshot();

    // Act
    const result = NfseToIssueBankPaymentMapper.toIssueBankPaymentInput({
      nfseId: 7,
      issuedAt: new Date('2026-08-20T15:00:00-03:00'),
      snapshot,
    });

    // Assert
    expect(result.fineRate).toBeNull();
    expect(result.moraRate).toBeNull();
  });

  it('should keep fineRate 0 instead of coercing to null', () => {
    // Arrange
    const snapshot = makeSnapshot();

    // Act
    const result = NfseToIssueBankPaymentMapper.toIssueBankPaymentInput({
      nfseId: 7,
      issuedAt: new Date('2026-08-20T15:00:00-03:00'),
      snapshot,
      fineRate: 0,
      moraRate: 0,
    });

    // Assert
    expect(result.fineRate).toBe(0);
    expect(result.moraRate).toBe(0);
  });
});
