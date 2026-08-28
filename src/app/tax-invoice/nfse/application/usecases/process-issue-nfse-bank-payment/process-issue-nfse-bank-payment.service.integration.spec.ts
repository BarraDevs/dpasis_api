import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentFakeAdapterGateway } from 'src/infra/bank-payment/adapters/fake/bank-payment-fake.gateway';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { LoggerModule } from 'src/infra/logger/logger.module';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { NfseQueueModule } from '../../queue/nfse-queue.module';
import type { NfseIssueSnapshot } from '../issue-nfse/issue-nfse.service';
import { ProcessIssueNfseBankPayment } from './process-issue-nfse-bank-payment.service';

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
        description: 'Desenvolvimento de sistema',
        serviceMunicipalCodeIbge: '3529401',
        issExigibility: 1,
        issWithheld: false,
        servicesValue: 1000,
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
      zipCode: '01310100',
    },
    bankPayment: {
      invoiceType: ClientInvoiceConfigType.MONTHLY,
      dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
      dueDateDay: 15,
      dueMonth: null,
      deadlineDays: null,
      referenceMonth: 8,
      referenceYear: 2026,
    },
    ...overrides,
  };
}

async function seedCompany(prisma: PrismaService) {
  return prisma.company.create({
    data: {
      name: 'Empresa Teste',
      fantasyName: 'Empresa Teste',
      document: `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 14),
      active: true,
      zipCode: '01310100',
      street: 'Av Paulista',
      number: '100',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      phone01: '11999999999',
      email01: `empresa-${Date.now()}@test.com`,
    },
  });
}

async function seedClient(prisma: PrismaService, clientId: number) {
  const group = await prisma.clientGroup.create({ data: { name: `Grupo ${clientId}`, active: true } });
  const resale = await prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) });
  const company = await prisma.company.create({ data: buildMinimalCompanyData() });

  return prisma.client.create({
    data: {
      id: clientId,
      type: ClientType.PJ,
      document: `${clientId}`.padStart(14, '0'),
      ie: null,
      groupId: group.id,
      resaleId: resale.id,
      companyId: company.id,
      companyName: 'Cliente LTDA',
      fantasyName: null,
      headquarters: 'São Paulo',
      invoiceType: ClientInvoiceType.CONTRACT,
      generateInvoice: true,
      active: true,
    },
  });
}

async function seedBank(prisma: PrismaService) {
  return prisma.bank.create({
    data: {
      drawer: 'Test Drawer',
      wallet: '123',
      account: '12345',
      agency: '0001',
      bankCode: '001',
      bankName: 'Test Bank',
      paymentLocation: null,
      active: true,
    },
  });
}

async function seedInvoiceConfig(
  prisma: PrismaService,
  clientId: number,
  billingAddressId: number,
  bankId: number,
) {
  return prisma.clientInvoiceConfig.create({
    data: {
      clientId,
      generateNf: true,
      type: ClientInvoiceConfigType.MONTHLY,
      emissionDay: 5,
      dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
      dueDateDay: 15,
      dueMonth: null,
      deadlineDays: null,
      months: [],
      billingAddressId,
      bankId,
      autoProtestBoleto: false,
      issWithheld: false,
      message: null,
    },
  });
}

async function seedNfse(
  prisma: PrismaService,
  companyId: number,
  overrides: {
    status?: NfseStatus;
    clientId?: number;
    bankPaymentProvider?: string | null;
    bankPaymentRequestCode?: string | null;
    data?: NfseIssueSnapshot;
  } = {},
) {
  return prisma.nfse.create({
    data: {
      companyId,
      clientId: overrides.clientId ?? 1,
      rpsNumber: Date.now() % 100_000,
      rpsSeries: 'NFSE',
      status: overrides.status ?? NfseStatus.ISSUED,
      batchProtocol: 'protocol-123',
      nfseNumber: overrides.status === NfseStatus.PENDING ? null : '1000',
      verificationCode: overrides.status === NfseStatus.PENDING ? null : 'ABC',
      issuedAt: overrides.status === NfseStatus.PENDING ? null : new Date('2026-08-20T12:00:00-03:00'),
      bankPaymentProvider: overrides.bankPaymentProvider ?? null,
      bankPaymentRequestCode: overrides.bankPaymentRequestCode ?? null,
      data: (overrides.data ?? makeSnapshot()) as unknown as object,
    },
  });
}

describe('ProcessIssueNfseBankPayment - Integration tests', () => {
  let sut: ProcessIssueNfseBankPayment;
  let prisma: PrismaService;
  let bankPaymentGateway: BankPaymentFakeAdapterGateway;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule,
        LoggerModule,
        NfseQueueModule.register(),
      ],
    }).compile();

    sut = module.get(ProcessIssueNfseBankPayment);
    prisma = module.get(PrismaService);
    bankPaymentGateway = module.get(TOKENS.BankPaymentGateway);
  });

  beforeEach(async() => {
    await prisma.truncate();
    bankPaymentGateway.issueCalls.length = 0;
    bankPaymentGateway.issueError = null;
    bankPaymentGateway.issueResult = {
      provider: BankPaymentProvider.INTER,
      requestCode: 'fake-request-code',
    };
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw NfseNotFoundError when the nfse does not exist', async() => {
    await expect(sut.execute({ nfseId: 999_999 })).rejects.toThrow(NfseNotFoundError);
  });

  it('should be a no-op when nfse is PENDING', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    const nfse = await seedNfse(prisma, company.id, { status: NfseStatus.PENDING });

    // Act
    const result = await sut.execute({ nfseId: nfse.id });

    // Assert
    expect(result).toBeNull();
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved?.bankPaymentProvider).toBeNull();
    expect(saved?.bankPaymentRequestCode).toBeNull();
    expect(bankPaymentGateway.issueCalls).toHaveLength(0);
  });

  it('should be a no-op when bank payment is already linked', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    const nfse = await seedNfse(prisma, company.id, {
      bankPaymentProvider: BankPaymentProvider.INTER,
      bankPaymentRequestCode: 'already-there',
    });

    // Act
    const result = await sut.execute({ nfseId: nfse.id });

    // Assert
    expect(result).toBeNull();
    expect(bankPaymentGateway.issueCalls).toHaveLength(0);
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved?.bankPaymentRequestCode).toBe('already-there');
  });

  it('should issue bank payment and persist provider/requestCode', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    const nfse = await seedNfse(prisma, company.id);
    bankPaymentGateway.issueResult = {
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-integration-1',
    };

    // Act
    const result = await sut.execute({ nfseId: nfse.id });

    // Assert
    expect(result).toEqual({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-integration-1',
    });
    expect(bankPaymentGateway.issueCalls).toHaveLength(1);
    expect(bankPaymentGateway.issueCalls[0]).toMatchObject({
      provider: BankPaymentProvider.INTER,
      yourNumber: String(nfse.id),
      amount: 1000,
    });
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved).toMatchObject({
      bankPaymentProvider: BankPaymentProvider.INTER,
      bankPaymentRequestCode: 'req-integration-1',
    });
  });

  it('should propagate Inter errors and leave bank payment fields null', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    const nfse = await seedNfse(prisma, company.id);
    bankPaymentGateway.issueError = new Error('Inter unavailable');

    // Act & Assert
    await expect(sut.execute({ nfseId: nfse.id })).rejects.toThrow('Inter unavailable');
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved?.bankPaymentProvider).toBeNull();
    expect(saved?.bankPaymentRequestCode).toBeNull();
  });

  it('should issue bank payment using invoice config fallback when snapshot lacks bankPayment', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    const clientId = Date.now() % 100_000;
    const client = await seedClient(prisma, clientId);
    const bank = await seedBank(prisma);
    const billingAddress = await prisma.clientAddress.create({
      data: {
        clientId: client.id,
        type: ClientAddressType.BILLING,
        zipCode: '01310-100',
        street: 'Av Paulista',
        number: '500',
        complement: null,
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        cityCodeIbge: '3550308',
        state: 'SP',
        active: true,
      },
    });
    await seedInvoiceConfig(prisma, client.id, billingAddress.id, bank.id);
    const nfse = await seedNfse(prisma, company.id, {
      clientId: client.id,
      data: makeSnapshot({ bankPayment: undefined }),
    });
    bankPaymentGateway.issueResult = {
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-fallback',
    };

    // Act
    const result = await sut.execute({ nfseId: nfse.id });

    // Assert
    expect(result).toEqual({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-fallback',
    });
    expect(bankPaymentGateway.issueCalls).toHaveLength(1);
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved).toMatchObject({
      bankPaymentProvider: BankPaymentProvider.INTER,
      bankPaymentRequestCode: 'req-fallback',
    });
  });

  it('should return without issuing when fallback invoice config is missing', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    const clientId = Date.now() % 100_000;
    await seedClient(prisma, clientId);
    const nfse = await seedNfse(prisma, company.id, {
      clientId,
      data: makeSnapshot({ bankPayment: undefined }),
    });

    // Act
    const result = await sut.execute({ nfseId: nfse.id });

    // Assert
    expect(result).toBeNull();
    expect(bankPaymentGateway.issueCalls).toHaveLength(0);
    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved?.bankPaymentProvider).toBeNull();
    expect(saved?.bankPaymentRequestCode).toBeNull();
  });
});
