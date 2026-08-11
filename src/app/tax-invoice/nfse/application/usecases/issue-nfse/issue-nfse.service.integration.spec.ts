import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { TOKENS } from 'src/core/di/token';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
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
  const [group, resale] = await Promise.all([
    prisma.clientGroup.create({ data: { name: `Grupo ${clientId}`, active: true } }),
    prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
  ]);

  return prisma.client.create({
    data: {
      id: clientId,
      type: ClientType.PJ,
      document: `${clientId}`.padStart(14, '0'),
      ie: null,
      groupId: group.id,
      resaleId: resale.id,
      companyName: 'Cliente LTDA',
      fantasyName: null,
      headquarters: 'São Paulo',
      invoiceType: ClientInvoiceType.CONTRACT,
      generateInvoice: true,
      active: true,
    },
  });
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

  it('should throw ClientAddressForNfseNotFoundError when the client has no billing or main address with cityCodeIbge', async() => {
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
    await prisma.clientAddress.create({
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

    const sequence = await prisma.nfseRpsSequence.findUnique({ where: { companyId: company.id } });
    expect(sequence?.nextId).toBe(2);

    expect(queueProducer.addedIssueBatchJobs).toEqual([
      expect.objectContaining({ data: { nfseId: result.id } }),
    ]);
  });
});
