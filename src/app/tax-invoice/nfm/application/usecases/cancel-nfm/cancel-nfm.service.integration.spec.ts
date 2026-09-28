import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { TOKENS } from 'src/core/di/token';
import { BankPaymentFakeAdapterGateway } from 'src/infra/bank-payment/adapters/fake/bank-payment-fake.gateway';
import { BankPaymentProvider } from 'src/infra/bank-payment/enums/bank-payment-provider.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import type { INfsGenerationGateway } from 'src/infra/nfs-generation/nfs-generation.gateway';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { seedClientInvoiceConfig } from 'src/test/fixtures/seed-client-invoice-config';
import { NfmNfseMissingError } from '../../../domain/errors/nfm-nfse-missing.error';
import { NfmNotFoundError } from '../../../domain/errors/nfm-not-found.error';
import { NfmModule } from '../../../nfm.module';
import { NfseNotIssuedError } from 'src/app/tax-invoice/nfse/domain/errors/nfse-not-issued.error';
import { CancelNfm } from './cancel-nfm.service';

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
  const [group, resale, company] = await Promise.all([
    prisma.clientGroup.create({ data: { name: `Grupo ${clientId}`, active: true } }),
    prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    prisma.company.create({ data: buildMinimalCompanyData() }),
  ]);

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

async function seedProviderConfig(prisma: PrismaService, companyId: number) {
  return prisma.nfsProviderConfig.create({
    data: {
      companyId,
      vendor: 'giss',
      municipalRegistration: '12345',
      municipalCodeIbge: '3529401',
      serieRps: 'NFSE',
      environment: NfsProviderEnvironment.Demonstration,
      certFilePath: '/certs/x.pfx',
      certPasswordEnvVar: 'X_PASS',
      vendorConfig: { municipioSlug: 'demonstracao' },
    },
  });
}

async function seedCnaeNbsIndop(prisma: PrismaService): Promise<number> {
  const suffix = String(Date.now()).slice(-8);
  const cnae = await prisma.cnae.create({
    data: { code: `C${suffix}`, description: 'CNAE CancelNfm' },
  });
  const nbs = await prisma.nbs.create({
    data: { code: `N${suffix}`, description: 'NBS CancelNfm' },
  });
  const indop = await prisma.indop.create({
    data: { code: `I${suffix}`, description: 'INDOP CancelNfm' },
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

describe('CancelNfm - Integration tests', () => {
  let sut: CancelNfm;
  let prisma: PrismaService;
  let moduleRef: TestingModule;
  let nfsGenerationGateway: INfsGenerationGateway;
  let bankPaymentGateway: BankPaymentFakeAdapterGateway;

  beforeAll(async() => {
    moduleRef = await Test.createTestingModule({
      imports: [NfmModule],
    })
      .overrideProvider(TOKENS.NfsGenerationGateway)
      .useValue(createMock<INfsGenerationGateway>())
      .compile();

    sut = moduleRef.get(CancelNfm);
    prisma = moduleRef.get(PrismaService);
    nfsGenerationGateway = moduleRef.get(TOKENS.NfsGenerationGateway);
    bankPaymentGateway = moduleRef.get(TOKENS.BankPaymentGateway);
  });

  beforeEach(async() => {
    await prisma.truncate();
    jest.clearAllMocks();
    bankPaymentGateway.cancelCalls.length = 0;
    bankPaymentGateway.cancelError = null;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw NfmNotFoundError when the nfm does not exist', async() => {
    await expect(sut.execute(999_999, { cancelReasonCode: 2 })).rejects.toThrow(NfmNotFoundError);
    expect(nfsGenerationGateway.cancelNfse).not.toHaveBeenCalled();
  });

  it('should cancel the linked ISSUED nfse and return the nfm id', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    const client = await seedClient(prisma, Date.now() % 100_000);
    await seedProviderConfig(prisma, company.id);
    const cnaeNbsIndopId = await seedCnaeNbsIndop(prisma);

    const nfse = await prisma.nfse.create({
      data: {
        companyId: company.id,
        clientId: client.id,
        rpsNumber: Date.now() % 100_000,
        rpsSeries: 'NFSE',
        status: NfseStatus.ISSUED,
        nfseNumber: '1000',
        verificationCode: 'ABC123',
        issuedAt: new Date('2026-07-20T10:00:00Z'),
        data: { providerDocument: '12345678000199' },
      },
    });

    const nfm = await prisma.nfm.create({
      data: {
        clientId: client.id,
        clientDocument: client.document,
        companyName: client.companyName,
        referenceMonth: 8,
        referenceYear: 2026,
        totalValueInCents: 10000,
        cnaeNbsIndopId,
        nfseId: nfse.id,
        data: { client: { id: client.id } },
      },
    });

    jest.spyOn(nfsGenerationGateway, 'cancelNfse').mockResolvedValue({ confirmedAt: '2026-07-29T12:00:00.000Z' });

    // Act
    const result = await sut.execute(nfm.id, { cancelReasonCode: 2 });

    // Assert
    expect(result).toEqual({
      id: nfm.id,
      status: NfseStatus.CANCELED,
      canceledAt: new Date('2026-07-29T12:00:00.000Z'),
      bankPaymentCanceled: false,
    });

    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved).toMatchObject({
      status: NfseStatus.CANCELED,
      cancelReasonCode: 2,
    });
    expect(saved?.canceledAt).toEqual(new Date('2026-07-29T12:00:00.000Z'));
  });

  it('should throw NfmNfseMissingError when nfm has no linked nfse', async() => {
    // Arrange
    const client = await seedClient(prisma, Date.now() % 100_000);
    const cnaeNbsIndopId = await seedCnaeNbsIndop(prisma);
    const nfm = await prisma.nfm.create({
      data: {
        clientId: client.id,
        clientDocument: client.document,
        companyName: client.companyName,
        referenceMonth: 8,
        referenceYear: 2026,
        totalValueInCents: 10000,
        cnaeNbsIndopId,
        nfseId: null,
        data: { client: { id: client.id } },
      },
    });

    // Act & Assert
    await expect(sut.execute(nfm.id, { cancelReasonCode: 2 })).rejects.toThrow(NfmNfseMissingError);
    expect(nfsGenerationGateway.cancelNfse).not.toHaveBeenCalled();
  });

  it('should throw NfseNotIssuedError when linked nfse is PENDING', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    const client = await seedClient(prisma, Date.now() % 100_000);
    await seedProviderConfig(prisma, company.id);
    const cnaeNbsIndopId = await seedCnaeNbsIndop(prisma);

    const nfse = await prisma.nfse.create({
      data: {
        companyId: company.id,
        clientId: client.id,
        rpsNumber: Date.now() % 100_000,
        rpsSeries: 'NFSE',
        status: NfseStatus.PENDING,
        data: { providerDocument: '12345678000199' },
      },
    });

    const nfm = await prisma.nfm.create({
      data: {
        clientId: client.id,
        clientDocument: client.document,
        companyName: client.companyName,
        referenceMonth: 8,
        referenceYear: 2026,
        totalValueInCents: 10000,
        cnaeNbsIndopId,
        nfseId: nfse.id,
        data: { client: { id: client.id } },
      },
    });

    // Act & Assert
    await expect(sut.execute(nfm.id, { cancelReasonCode: 2 })).rejects.toThrow(NfseNotIssuedError);
    expect(nfsGenerationGateway.cancelNfse).not.toHaveBeenCalled();
  });

  it('should cancel the linked boleto before canceling the nfse', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    const client = await seedClient(prisma, Date.now() % 100_000);
    await seedClientInvoiceConfig(moduleRef, client.id);
    await seedProviderConfig(prisma, company.id);
    const cnaeNbsIndopId = await seedCnaeNbsIndop(prisma);

    const nfse = await prisma.nfse.create({
      data: {
        companyId: company.id,
        clientId: client.id,
        rpsNumber: Date.now() % 100_000,
        rpsSeries: 'NFSE',
        status: NfseStatus.ISSUED,
        nfseNumber: '2000',
        verificationCode: 'XYZ',
        issuedAt: new Date('2026-07-20T10:00:00Z'),
        bankPaymentProvider: BankPaymentProvider.INTER,
        bankPaymentRequestCode: 'req-cancel-1',
        data: { providerDocument: '12345678000199' },
      },
    });

    const nfm = await prisma.nfm.create({
      data: {
        clientId: client.id,
        clientDocument: client.document,
        companyName: client.companyName,
        referenceMonth: 8,
        referenceYear: 2026,
        totalValueInCents: 10000,
        cnaeNbsIndopId,
        nfseId: nfse.id,
        data: { client: { id: client.id } },
      },
    });

    jest.spyOn(nfsGenerationGateway, 'cancelNfse').mockResolvedValue({ confirmedAt: '2026-07-29T12:00:00.000Z' });

    // Act
    const result = await sut.execute(nfm.id, { cancelReasonCode: 2 });

    // Assert
    expect(bankPaymentGateway.cancelCalls).toEqual([
      expect.objectContaining({
        requestCode: 'req-cancel-1',
        provider: BankPaymentProvider.INTER,
        reason: 'Serviço não prestado',
      }),
    ]);
    expect(result).toMatchObject({
      id: nfm.id,
      status: NfseStatus.CANCELED,
      bankPaymentCanceled: true,
    });
    expect(result.bankPaymentError).toBeUndefined();

    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved?.status).toBe(NfseStatus.CANCELED);
  });

  it('should still cancel the nfse when the boleto cancel fails and report the error', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    const client = await seedClient(prisma, Date.now() % 100_000);
    await seedClientInvoiceConfig(moduleRef, client.id);
    await seedProviderConfig(prisma, company.id);
    const cnaeNbsIndopId = await seedCnaeNbsIndop(prisma);

    const nfse = await prisma.nfse.create({
      data: {
        companyId: company.id,
        clientId: client.id,
        rpsNumber: Date.now() % 100_000,
        rpsSeries: 'NFSE',
        status: NfseStatus.ISSUED,
        nfseNumber: '2001',
        verificationCode: 'XYZ',
        issuedAt: new Date('2026-07-20T10:00:00Z'),
        bankPaymentProvider: BankPaymentProvider.INTER,
        bankPaymentRequestCode: 'req-cancel-fail',
        data: { providerDocument: '12345678000199' },
      },
    });

    const nfm = await prisma.nfm.create({
      data: {
        clientId: client.id,
        clientDocument: client.document,
        companyName: client.companyName,
        referenceMonth: 8,
        referenceYear: 2026,
        totalValueInCents: 10000,
        cnaeNbsIndopId,
        nfseId: nfse.id,
        data: { client: { id: client.id } },
      },
    });

    bankPaymentGateway.cancelError = new Error('Cobrança já paga');
    jest.spyOn(nfsGenerationGateway, 'cancelNfse').mockResolvedValue({ confirmedAt: '2026-07-29T12:00:00.000Z' });

    // Act
    const result = await sut.execute(nfm.id, { cancelReasonCode: 1 });

    // Assert
    expect(result).toMatchObject({
      id: nfm.id,
      status: NfseStatus.CANCELED,
      bankPaymentCanceled: false,
      bankPaymentError: 'Cobrança já paga',
    });
    expect(nfsGenerationGateway.cancelNfse).toHaveBeenCalled();

    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved?.status).toBe(NfseStatus.CANCELED);
  });
});
