import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { NfmNotFoundError } from 'src/app/tax-invoice/nfm/domain/errors/nfm-not-found.error';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import type { NfseIssueSnapshot } from 'src/app/tax-invoice/nfse/application/usecases/issue-nfse/issue-nfse.service';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentFakeAdapterGateway } from 'src/infra/bank-payment/adapters/fake/bank-payment-fake.gateway';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { seedClientInvoiceConfig } from 'src/test/fixtures/seed-client-invoice-config';
import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test, TestingModule } from '@nestjs/testing';
import { NfseBankPaymentAlreadyLinkedError } from '../../../domain/errors/nfse-bank-payment-already-linked.error';
import { NfseNotIssuedForBankPaymentError } from '../../../domain/errors/nfse-not-issued-for-bank-payment.error';
import { BankPaymentModule } from '../../../bank-payment.module';
import { IssueBankPaymentByNfmId } from './issue-bank-payment-by-nfm-id.service';

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

async function seedCnaeNbsIndop(prisma: PrismaService): Promise<number> {
  const suffix = String(Date.now()).slice(-8);
  const cnae = await prisma.cnae.create({
    data: { code: `C${suffix}`, description: 'CNAE IssueByNfm' },
  });
  const nbs = await prisma.nbs.create({
    data: { code: `N${suffix}`, description: 'NBS IssueByNfm' },
  });
  const indop = await prisma.indop.create({
    data: { code: `I${suffix}`, description: 'INDOP IssueByNfm' },
  });
  const corr = await prisma.cnaeNbsIndop.create({
    data: {
      cnaeId: cnae.id,
      nbsId: nbs.id,
      indopId: indop.id,
      serviceListItemCode: '01.07',
    },
  });
  return corr.id;
}

describe('IssueBankPaymentByNfmId - Integration tests', () => {
  let sut: IssueBankPaymentByNfmId;
  let prisma: PrismaService;
  let moduleRef: TestingModule;
  let bankPaymentGateway: BankPaymentFakeAdapterGateway;

  beforeAll(async() => {
    moduleRef = await Test.createTestingModule({
      imports: [BankPaymentModule],
    }).compile();

    sut = moduleRef.get(IssueBankPaymentByNfmId);
    prisma = moduleRef.get(PrismaService);
    bankPaymentGateway = moduleRef.get(TOKENS.BankPaymentGateway) as BankPaymentFakeAdapterGateway;
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

  it('should throw NfmNotFoundError when the nfm does not exist', async() => {
    await expect(sut.execute(999_999)).rejects.toThrow(NfmNotFoundError);
  });

  it('should throw NfseNotIssuedForBankPaymentError when nfse is PENDING', async() => {
    const company = await seedCompany(prisma);
    const client = await seedClient(prisma, Date.now() % 100_000);
    const cnaeNbsIndopId = await seedCnaeNbsIndop(prisma);

    const nfse = await prisma.nfse.create({
      data: {
        companyId: company.id,
        clientId: client.id,
        rpsNumber: Date.now() % 100_000,
        rpsSeries: 'NFSE',
        status: NfseStatus.PENDING,
        data: makeSnapshot() as unknown as object,
      },
    });

    const nfm = await prisma.nfm.create({
      data: {
        clientId: client.id,
        clientDocument: client.document,
        companyName: client.companyName,
        referenceMonth: 8,
        referenceYear: 2026,
        totalValueInCents: 100000,
        cnaeNbsIndopId,
        nfseId: nfse.id,
        data: { client: { id: client.id } },
      },
    });

    await expect(sut.execute(nfm.id)).rejects.toThrow(NfseNotIssuedForBankPaymentError);
    expect(bankPaymentGateway.issueCalls).toHaveLength(0);
  });

  it('should throw NfseBankPaymentAlreadyLinkedError when boleto is already linked', async() => {
    const company = await seedCompany(prisma);
    const client = await seedClient(prisma, Date.now() % 100_000);
    const cnaeNbsIndopId = await seedCnaeNbsIndop(prisma);

    const nfse = await prisma.nfse.create({
      data: {
        companyId: company.id,
        clientId: client.id,
        rpsNumber: Date.now() % 100_000,
        rpsSeries: 'NFSE',
        status: NfseStatus.ISSUED,
        nfseNumber: '1000',
        verificationCode: 'ABC',
        issuedAt: new Date('2026-08-20T12:00:00-03:00'),
        bankPaymentProvider: BankPaymentProvider.INTER,
        bankPaymentRequestCode: 'already-there',
        data: makeSnapshot() as unknown as object,
      },
    });

    const nfm = await prisma.nfm.create({
      data: {
        clientId: client.id,
        clientDocument: client.document,
        companyName: client.companyName,
        referenceMonth: 8,
        referenceYear: 2026,
        totalValueInCents: 100000,
        cnaeNbsIndopId,
        nfseId: nfse.id,
        data: { client: { id: client.id } },
      },
    });

    await expect(sut.execute(nfm.id)).rejects.toThrow(NfseBankPaymentAlreadyLinkedError);
    expect(bankPaymentGateway.issueCalls).toHaveLength(0);
  });

  it('should issue bank payment for ISSUED nfse without boleto and persist requestCode', async() => {
    const company = await seedCompany(prisma);
    const client = await seedClient(prisma, Date.now() % 100_000);
    await seedClientInvoiceConfig(moduleRef, client.id);
    const cnaeNbsIndopId = await seedCnaeNbsIndop(prisma);

    const nfse = await prisma.nfse.create({
      data: {
        companyId: company.id,
        clientId: client.id,
        rpsNumber: Date.now() % 100_000,
        rpsSeries: 'NFSE',
        status: NfseStatus.ISSUED,
        nfseNumber: '1000',
        verificationCode: 'ABC',
        issuedAt: new Date('2026-08-20T12:00:00-03:00'),
        data: makeSnapshot() as unknown as object,
      },
    });

    const nfm = await prisma.nfm.create({
      data: {
        clientId: client.id,
        clientDocument: client.document,
        companyName: client.companyName,
        referenceMonth: 8,
        referenceYear: 2026,
        totalValueInCents: 100000,
        cnaeNbsIndopId,
        nfseId: nfse.id,
        data: { client: { id: client.id } },
      },
    });

    bankPaymentGateway.issueResult = {
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-by-nfm',
    };

    const result = await sut.execute(nfm.id);

    expect(result).toEqual({
      provider: BankPaymentProvider.INTER,
      requestCode: 'req-by-nfm',
    });
    expect(bankPaymentGateway.issueCalls).toHaveLength(1);

    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved).toMatchObject({
      bankPaymentProvider: BankPaymentProvider.INTER,
      bankPaymentRequestCode: 'req-by-nfm',
    });
  });
});
