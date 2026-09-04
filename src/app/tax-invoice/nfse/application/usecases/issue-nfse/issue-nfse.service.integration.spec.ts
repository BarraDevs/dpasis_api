import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ClientInvoiceConfigNotFoundError } from 'src/app/client/client-invoice-config/domain/errors/client-invoice-config-not-found.error';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { NfmAlreadyHasActiveNfseError } from 'src/app/tax-invoice/nfm/domain/errors/nfm-already-has-active-nfse.error';
import { TOKENS } from 'src/core/di/token';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { NfseQueueFakeAdapterProducer } from '../../../infra/driven/queue/fake/nfse-queue-fake.producer';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { ClientAddressForNfseNotFoundError } from '../../../domain/errors/client-address-for-nfse-not-found.error';
import { NfseModule } from '../../../nfse.module';
import { IssueNfse } from './issue-nfse.service';
import { IssueNfseInputDto } from './dtos/issue-nfse.dto';
import { CompanyNfsConfigNotFoundError } from 'src/app/company/company-nfs-config/domain/errors/company-nfs-config-not-found.error';

function makeIssueNfseInput(companyId: number, clientId: number): IssueNfseInputDto {
  return {
    companyId,
    clientId,
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

async function seedNfm(prisma: PrismaService, clientId: number): Promise<number> {
  const suffix = String(Date.now()).slice(-8) + String(Math.floor(Math.random() * 1000));
  const cnae = await prisma.cnae.create({ data: { code: `C${suffix}`, description: 'CNAE ISSUE' } });
  const nbs = await prisma.nbs.create({ data: { code: `N${suffix}`, description: 'NBS ISSUE' } });
  const indop = await prisma.indop.create({ data: { code: `I${suffix}`, description: 'INDOP ISSUE' } });
  const correlation = await prisma.cnaeNbsIndop.create({
    data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id, serviceListItemCode: '01.07' },
  });
  const nfm = await prisma.nfm.create({
    data: {
      clientId,
      clientDocument: String(clientId).padStart(14, '0'),
      companyName: 'Cliente LTDA',
      referenceMonth: 1,
      referenceYear: 2026,
      totalValueInCents: 10000,
      cnaeNbsIndopId: correlation.id,
      data: {},
    },
    select: { id: true },
  });
  return nfm.id;
}

describe('IssueNfse - Integration tests', () => {
  let sut: IssueNfse;
  let prisma: PrismaService;
  let queueProducer: NfseQueueFakeAdapterProducer;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [NfseModule],
    }).compile();

    sut = module.get(IssueNfse);
    prisma = module.get(PrismaService);
    queueProducer = module.get(TOKENS.NfseQueueProducer);
  });

  beforeEach(async() => {
    await prisma.truncate();
    queueProducer.addedIssueBatchJobs.length = 0;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw CompanyNfsConfigNotFoundError when the company has no provider config', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    const client = await seedClient(prisma, Date.now() % 100_000);

    // Act & Assert
    await expect(sut.execute(makeIssueNfseInput(company.id, client.id))).rejects.toThrow(CompanyNfsConfigNotFoundError);
  });

  it('should throw ClientInvoiceConfigNotFoundError when the client has no invoice config', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    const client = await seedClient(prisma, Date.now() % 100_000);
    await prisma.nfsProviderConfig.create({
      data: {
        companyId: company.id,
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

    // Act & Assert
    await expect(sut.execute(makeIssueNfseInput(company.id, client.id))).rejects.toThrow(ClientInvoiceConfigNotFoundError);
  });

  it('should throw ClientAddressForNfseNotFoundError when the client has no billing or main address with cityCodeIbge', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    const client = await seedClient(prisma, Date.now() % 100_000);
    const bank = await seedBank(prisma);
    await prisma.nfsProviderConfig.create({
      data: {
        companyId: company.id,
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
    const supportAddress = await prisma.clientAddress.create({
      data: {
        clientId: client.id,
        type: ClientAddressType.SUPPORT,
        zipCode: '01310-100',
        street: 'Rua Support',
        number: '1',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        cityCodeIbge: '3550308',
        state: 'SP',
        active: true,
      },
    });
    await seedInvoiceConfig(prisma, client.id, supportAddress.id, bank.id);

    // Act & Assert
    await expect(sut.execute(makeIssueNfseInput(company.id, client.id))).rejects.toThrow(ClientAddressForNfseNotFoundError);
  });

  it('should persist a PENDING nfse, reserve an rps number and enqueue the issue-batch job', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    const clientId = Date.now() % 100_000;
    const client = await seedClient(prisma, clientId);
    await prisma.nfsProviderConfig.create({
      data: {
        companyId: company.id,
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
    const bank = await seedBank(prisma);
    const billingAddress = await prisma.clientAddress.create({
      data: {
        clientId: client.id,
        type: ClientAddressType.BILLING,
        zipCode: '01310-100',
        street: 'Av. Paulista',
        number: '500',
        complement: 'Sala 301',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        cityCodeIbge: '3550308',
        state: 'SP',
        active: true,
      },
    });
    await seedInvoiceConfig(prisma, client.id, billingAddress.id, bank.id);

    // Act
    const result = await sut.execute(makeIssueNfseInput(company.id, client.id));

    // Assert
    expect(result.status).toBe(NfseStatus.PENDING);

    const saved = await prisma.nfse.findUnique({ where: { id: result.id } });
    expect(saved).toMatchObject({
      companyId: company.id,
      clientId: client.id,
      rpsSeries: 'NFSE',
      status: NfseStatus.PENDING,
    });
    expect(saved?.rpsNumber).toBe(1);
    expect(saved?.data).toMatchObject({
      clientType: expect.any(String),
      takerAddress: expect.objectContaining({ city: 'São Paulo' }),
      bankPayment: expect.objectContaining({
        invoiceType: ClientInvoiceConfigType.MONTHLY,
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 15,
      }),
    });

    const sequence = await prisma.nfseRpsSequence.findUnique({ where: { companyId: company.id } });
    expect(sequence?.nextId).toBe(2);

    expect(queueProducer.addedIssueBatchJobs).toEqual([
      expect.objectContaining({ data: { nfseId: result.id } }),
    ]);

    const outbox = await prisma.nfseOutbox.findFirst({ where: { nfseId: result.id } });
    expect(outbox).toMatchObject({
      nfseId: result.id,
      jobName: JobName.IssueNfseBatch,
      payload: { nfseId: result.id },
    });
    expect(outbox?.dispatchedAt).toBeInstanceOf(Date);
  });

  it('should link nfmId bilaterally and dispatch the outbox when nfmId is provided', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    const clientId = Date.now() % 100_000;
    const client = await seedClient(prisma, clientId);
    await prisma.nfsProviderConfig.create({
      data: {
        companyId: company.id,
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
    const bank = await seedBank(prisma);
    const billingAddress = await prisma.clientAddress.create({
      data: {
        clientId: client.id,
        type: ClientAddressType.BILLING,
        zipCode: '01310-100',
        street: 'Av. Paulista',
        number: '500',
        complement: 'Sala 301',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        cityCodeIbge: '3550308',
        state: 'SP',
        active: true,
      },
    });
    await seedInvoiceConfig(prisma, client.id, billingAddress.id, bank.id);
    const nfmId = await seedNfm(prisma, client.id);

    // Act
    const result = await sut.execute({ ...makeIssueNfseInput(company.id, client.id), nfmId });

    // Assert
    const saved = await prisma.nfse.findUnique({ where: { id: result.id } });
    expect(saved?.nfmId).toBe(nfmId);
    const nfm = await prisma.nfm.findUnique({ where: { id: nfmId } });
    expect(nfm?.nfseId).toBe(result.id);

    const outbox = await prisma.nfseOutbox.findFirst({ where: { nfseId: result.id } });
    expect(outbox?.dispatchedAt).toBeInstanceOf(Date);
  });

  it('should refuse a second active nfse for the same nfm', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    const clientId = Date.now() % 100_000;
    const client = await seedClient(prisma, clientId);
    await prisma.nfsProviderConfig.create({
      data: {
        companyId: company.id,
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
    const bank = await seedBank(prisma);
    const billingAddress = await prisma.clientAddress.create({
      data: {
        clientId: client.id,
        type: ClientAddressType.BILLING,
        zipCode: '01310-100',
        street: 'Av. Paulista',
        number: '500',
        complement: 'Sala 301',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        cityCodeIbge: '3550308',
        state: 'SP',
        active: true,
      },
    });
    await seedInvoiceConfig(prisma, client.id, billingAddress.id, bank.id);
    const nfmId = await seedNfm(prisma, client.id);
    await sut.execute({ ...makeIssueNfseInput(company.id, client.id), nfmId });

    // Act & Assert
    await expect(sut.execute({ ...makeIssueNfseInput(company.id, client.id), nfmId }))
      .rejects.toThrow(NfmAlreadyHasActiveNfseError);
  });
});
