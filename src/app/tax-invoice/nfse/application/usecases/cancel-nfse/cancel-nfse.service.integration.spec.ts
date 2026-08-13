import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { TOKENS } from 'src/core/di/token';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import type { INfsGenerationGateway } from 'src/infra/nfs-generation/nfs-generation.gateway';
import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { NfseAlreadyCanceledError } from '../../../domain/errors/nfse-already-canceled.error';
import { NfseNotIssuedError } from '../../../domain/errors/nfse-not-issued.error';
import { NfseModule } from '../../../nfse.module';
import { CancelNfse } from './cancel-nfse.service';
import { CompanyNfsConfigNotFoundError } from 'src/app/company/company-nfs-config/domain/errors/company-nfs-config-not-found.error';

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

async function seedIssuedNfse(prisma: PrismaService, companyId: number, clientId: number) {
  return prisma.nfse.create({
    data: {
      companyId,
      clientId,
      rpsNumber: Date.now() % 100_000,
      rpsSeries: 'NFSE',
      status: NfseStatus.ISSUED,
      nfseNumber: '1000',
      verificationCode: 'ABC123',
      issuedAt: new Date('2026-07-20T10:00:00Z'),
      data: { providerDocument: '12345678000199' },
    },
  });
}

describe('CancelNfse - Integration tests', () => {
  let sut: CancelNfse;
  let prisma: PrismaService;
  let nfsGenerationGateway: INfsGenerationGateway;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [NfseModule],
    })
      .overrideProvider(TOKENS.NfsGenerationGateway)
      .useValue(createMock<INfsGenerationGateway>())
      .compile();

    sut = module.get(CancelNfse);
    prisma = module.get(PrismaService);
    nfsGenerationGateway = module.get(TOKENS.NfsGenerationGateway);
  });

  beforeEach(async() => {
    await prisma.truncate();
    jest.clearAllMocks();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw NfseNotFoundError when the nfse does not exist', async() => {
    await expect(sut.execute(999_999, { cancelReasonCode: 2 })).rejects.toThrow(NfseNotFoundError);
  });

  it('should throw NfseNotIssuedError when the nfse is not ISSUED', async() => {
    const company = await seedCompany(prisma);
    const client = await seedClient(prisma, Date.now() % 100_000);
    const nfse = await prisma.nfse.create({
      data: {
        companyId: company.id,
        clientId: client.id,
        rpsNumber: Date.now() % 100_000,
        rpsSeries: 'NFSE',
        status: NfseStatus.PENDING,
        data: {},
      },
    });

    await expect(sut.execute(nfse.id, { cancelReasonCode: 2 })).rejects.toThrow(NfseNotIssuedError);
  });

  it('should throw CompanyNfsConfigNotFoundError when the company has no provider config', async() => {
    const company = await seedCompany(prisma);
    const client = await seedClient(prisma, Date.now() % 100_000);
    const nfse = await seedIssuedNfse(prisma, company.id, client.id);

    await expect(sut.execute(nfse.id, { cancelReasonCode: 2 })).rejects.toThrow(CompanyNfsConfigNotFoundError);
  });

  it('should cancel an ISSUED nfse and persist canceledAt/cancelReasonCode', async() => {
    const company = await seedCompany(prisma);
    const client = await seedClient(prisma, Date.now() % 100_000);
    await seedProviderConfig(prisma, company.id);
    const nfse = await seedIssuedNfse(prisma, company.id, client.id);

    jest.spyOn(nfsGenerationGateway, 'cancelNfse').mockResolvedValue({ confirmedAt: '2026-07-29T12:00:00.000Z' });

    const result = await sut.execute(nfse.id, { cancelReasonCode: 2 });

    expect(result.status).toBe(NfseStatus.CANCELED);

    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved).toMatchObject({
      status: NfseStatus.CANCELED,
      cancelReasonCode: 2,
    });
    expect(saved?.canceledAt).toEqual(new Date('2026-07-29T12:00:00.000Z'));
  });

  it('should persist cancelReasonCode 4 when the gateway confirms cancellation', async() => {
    const company = await seedCompany(prisma);
    const client = await seedClient(prisma, Date.now() % 100_000);
    await seedProviderConfig(prisma, company.id);
    const nfse = await seedIssuedNfse(prisma, company.id, client.id);

    jest.spyOn(nfsGenerationGateway, 'cancelNfse').mockResolvedValue({ confirmedAt: '2026-07-29T15:30:00.000Z' });

    await sut.execute(nfse.id, { cancelReasonCode: 4 });

    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved).toMatchObject({
      status: NfseStatus.CANCELED,
      cancelReasonCode: 4,
    });
    expect(saved?.canceledAt).toEqual(new Date('2026-07-29T15:30:00.000Z'));
  });

  it('should call the gateway with nfse and provider data from persistence', async() => {
    const company = await seedCompany(prisma);
    const client = await seedClient(prisma, Date.now() % 100_000);
    await seedProviderConfig(prisma, company.id);
    const nfse = await seedIssuedNfse(prisma, company.id, client.id);

    jest.spyOn(nfsGenerationGateway, 'cancelNfse').mockResolvedValue({ confirmedAt: '2026-07-29T12:00:00.000Z' });

    await sut.execute(nfse.id, { cancelReasonCode: 2 });

    expect(nfsGenerationGateway.cancelNfse).toHaveBeenCalledWith({
      nfseNumber: '1000',
      providerDocument: '12345678000199',
      providerMunicipalCodeIbge: '3529401',
      providerMunicipalRegistration: '12345',
      cancelReasonCode: 2,
      provider: {
        certFilePath: '/certs/x.pfx',
        certPasswordEnvVar: 'X_PASS',
        environment: NfsProviderEnvironment.Demonstration,
        vendorConfig: { municipioSlug: 'demonstracao' },
      },
    });
  });

  it('should throw NfseAlreadyCanceledError when the nfse is already CANCELED', async() => {
    const company = await seedCompany(prisma);
    const client = await seedClient(prisma, Date.now() % 100_000);
    await seedProviderConfig(prisma, company.id);
    const nfse = await prisma.nfse.create({
      data: {
        companyId: company.id,
        clientId: client.id,
        rpsNumber: Date.now() % 100_000,
        rpsSeries: 'NFSE',
        status: NfseStatus.CANCELED,
        nfseNumber: '1000',
        canceledAt: new Date('2026-07-28T10:00:00Z'),
        cancelReasonCode: 2,
        data: { providerDocument: '12345678000199' },
      },
    });

    await expect(sut.execute(nfse.id, { cancelReasonCode: 2 })).rejects.toThrow(NfseAlreadyCanceledError);
    expect(nfsGenerationGateway.cancelNfse).not.toHaveBeenCalled();
  });

  it('should not persist cancellation when the gateway fails', async() => {
    const company = await seedCompany(prisma);
    const client = await seedClient(prisma, Date.now() % 100_000);
    await seedProviderConfig(prisma, company.id);
    const nfse = await seedIssuedNfse(prisma, company.id, client.id);

    jest.spyOn(nfsGenerationGateway, 'cancelNfse').mockRejectedValue(new Error('Erro ao cancelar NFS-e no Giss'));

    await expect(sut.execute(nfse.id, { cancelReasonCode: 2 })).rejects.toThrow('Erro ao cancelar NFS-e no Giss');

    const saved = await prisma.nfse.findUnique({ where: { id: nfse.id } });
    expect(saved).toMatchObject({
      status: NfseStatus.ISSUED,
      cancelReasonCode: null,
    });
    expect(saved?.canceledAt).toBeNull();
  });
});
