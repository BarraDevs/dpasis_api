import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { TOKENS } from 'src/core/di/token';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { NfseQueueFakeAdapterProducer } from 'src/app/tax-invoice/nfse/infra/driven/queue/fake/nfse-queue-fake.producer';
import { NfmModule } from '../../../nfm.module';
import { SaveElegibleNfms } from './save-elegible-nfms.service';

const TODAY = new Date().getDate();
const NOT_TODAY = TODAY >= 28 ? 1 : TODAY + 1;

type CreateClientOptions = {
  dueDateDay?: number;
  generateNf?: boolean;
  active?: boolean;
  invoiceType?: ClientInvoiceType;
  generateInvoice?: boolean;
  withItem?: boolean;
  withCityCodeIbge?: boolean;
};

type SeedBase = {
  groupId: number;
  resaleId: number;
  companyId: number;
  bankId: number;
  cnaeNbsIndopId: number;
  cnaeNbsIndopId2: number;
};

async function seedBase(prisma: PrismaService): Promise<SeedBase> {
  const [group, resale, company] = await Promise.all([
    prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
    prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    prisma.company.create({ data: buildMinimalCompanyData() }),
  ]);

  const bank = await prisma.bank.create({
    data: {
      drawer: 'Test Drawer',
      wallet: '123',
      account: `${Date.now()}`,
      agency: '0001',
      bankCode: `BNK${Date.now()}`,
      bankName: 'Banco Teste',
      paymentLocation: null,
      active: true,
    },
  });

  const [cnae, nbs, indop, indop2] = await Promise.all([
    prisma.cnae.create({ data: { code: `C${Date.now()}`, description: 'CNAE Teste', active: true } }),
    prisma.nbs.create({ data: { code: `N${Date.now()}`, description: 'NBS Teste', active: true } }),
    prisma.indop.create({ data: { code: `I${Date.now()}`, description: 'INDOP Teste', active: true } }),
    prisma.indop.create({ data: { code: `I2${Date.now()}`, description: 'INDOP2 Teste', active: true } }),
  ]);
  const cnaeNbsIndop = await prisma.cnaeNbsIndop.create({
    data: {
      cnaeId: cnae.id,
      nbsId: nbs.id,
      indopId: indop.id,
      serviceListItemCode: '01.07',
      active: true,
    },
  });
  const cnaeNbsIndop2 = await prisma.cnaeNbsIndop.create({
    data: {
      cnaeId: cnae.id,
      nbsId: nbs.id,
      indopId: indop2.id,
      serviceListItemCode: '01.07',
      active: true,
    },
  });

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
      simpleNationalOptant: false,
      fiscalIncentive: false,
      issRate: 0.05,
      issExigibility: 1,
    },
  });

  return {
    groupId: group.id,
    resaleId: resale.id,
    companyId: company.id,
    bankId: bank.id,
    cnaeNbsIndopId: cnaeNbsIndop.id,
    cnaeNbsIndopId2: cnaeNbsIndop2.id,
  };
}

async function createClientWithConfig(
  prisma: PrismaService,
  base: SeedBase,
  clientId: number,
  document: string,
  options: CreateClientOptions = {},
): Promise<void> {
  const {
    dueDateDay = TODAY,
    generateNf = true,
    active = true,
    invoiceType = ClientInvoiceType.CONTRACT,
    generateInvoice = true,
    withItem = false,
    withCityCodeIbge = true,
  } = options;

  const client = await prisma.client.create({
    data: {
      id: clientId,
      type: ClientType.PJ,
      document,
      ie: null,
      groupId: base.groupId,
      resaleId: base.resaleId,
      companyId: base.companyId,
      companyName: `Empresa ${clientId}`,
      fantasyName: null,
      headquarters: 'São Paulo',
      invoiceType,
      generateInvoice,
      active,
    },
  });

  const address = await prisma.clientAddress.create({
    data: {
      clientId: client.id,
      type: ClientAddressType.BILLING,
      zipCode: '01310-100',
      street: 'Av. Paulista',
      number: String(clientId),
      complement: null,
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      cityCodeIbge: withCityCodeIbge ? '3550308' : null,
      state: 'SP',
      active: true,
    },
  });

  await prisma.clientInvoiceConfig.create({
    data: {
      clientId: client.id,
      generateNf,
      type: ClientInvoiceConfigType.MONTHLY,
      emissionDay: 1,
      dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
      dueDateDay,
      dueMonth: null,
      deadlineDays: null,
      months: [],
      billingAddressId: address.id,
      bankId: base.bankId,
      autoProtestBoleto: false,
      issWithheld: false,
      message: null,
    },
  });

  if (withItem) {
    await addClientItem(prisma, client.id, base.cnaeNbsIndopId);
  }
}

async function addClientItem(
  prisma: PrismaService,
  clientId: number,
  cnaeNbsIndopId: number,
  description = `Item ${clientId}`,
): Promise<void> {
  await prisma.clientItem.create({
    data: {
      clientId,
      description,
      quantity: 2,
      unitValueInCents: 5000,
      cnaeNbsIndopId,
      active: true,
    },
  });
}

describe('SaveElegibleNfms - Integration tests', () => {
  let sut: SaveElegibleNfms;
  let prisma: PrismaService;
  let queueProducer: NfseQueueFakeAdapterProducer;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [NfmModule],
    }).compile();

    sut = module.get(SaveElegibleNfms);
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

  it('should return zeros when no elegible clients exist', async() => {
    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual({ created: 0, skipped: 0, failed: 0, errors: [] });
    expect(await prisma.nfm.count()).toBe(0);
    const cronRuns = await prisma.nfmCronRun.findMany();
    expect(cronRuns).toHaveLength(1);
    expect(cronRuns[0]).toMatchObject({
      createdCount: 0,
      skippedCount: 0,
      failedCount: 0,
      errors: [],
    });
  });

  it('should persist nfm linked to nfse and enqueue issue batch', async() => {
    // Arrange
    const base = await seedBase(prisma);
    await createClientWithConfig(prisma, base, 1, '00000000000101', { withItem: true });

    const now = new Date();
    const referenceMonth = now.getMonth() + 1;
    const referenceYear = now.getFullYear();

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual({ created: 1, skipped: 0, failed: 0, errors: [] });

    const rows = await prisma.nfm.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].clientId).toBe(1);
    expect(rows[0].cnaeNbsIndopId).toBe(base.cnaeNbsIndopId);
    expect(rows[0].nfseId).not.toBeNull();
    expect(rows[0].referenceMonth).toBe(referenceMonth);
    expect(rows[0].referenceYear).toBe(referenceYear);
    expect(rows[0].totalValueInCents).toBe(10000);
    expect(queueProducer.addedIssueBatchJobs).toHaveLength(1);
    expect(queueProducer.addedIssueBatchJobs[0].data).toEqual({ nfseId: rows[0].nfseId });

    const cronRuns = await prisma.nfmCronRun.findMany();
    expect(cronRuns).toHaveLength(1);
    expect(cronRuns[0]).toMatchObject({
      createdCount: 1,
      skippedCount: 0,
      failedCount: 0,
      errors: [],
    });
  });

  it('should skip when executed twice in the same month', async() => {
    // Arrange
    const base = await seedBase(prisma);
    await createClientWithConfig(prisma, base, 1, '00000000000101', { withItem: true });

    // Act
    const first = await sut.execute();
    const second = await sut.execute();

    // Assert
    expect(first).toEqual({ created: 1, skipped: 0, failed: 0, errors: [] });
    expect(second).toEqual({ created: 0, skipped: 1, failed: 0, errors: [] });
    expect(await prisma.nfm.count()).toBe(1);
    expect(await prisma.nfse.count()).toBe(1);

    const cronRuns = await prisma.nfmCronRun.findMany({ orderBy: { id: 'asc' } });
    expect(cronRuns).toHaveLength(2);
    expect(cronRuns[0]).toMatchObject({
      createdCount: 1,
      skippedCount: 0,
      failedCount: 0,
    });
    expect(cronRuns[1]).toMatchObject({
      createdCount: 0,
      skippedCount: 1,
      failedCount: 0,
    });
  });

  it('should create one nfm per cnaeNbsIndop group', async() => {
    // Arrange
    const base = await seedBase(prisma);
    await createClientWithConfig(prisma, base, 1, '00000000000101', { withItem: true });
    await addClientItem(prisma, 1, base.cnaeNbsIndopId, 'Item same group');
    await addClientItem(prisma, 1, base.cnaeNbsIndopId2, 'Item other group');

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.created).toBe(2);
    expect(await prisma.nfm.count()).toBe(2);
    expect(await prisma.nfse.count()).toBe(2);
  });

  it('should keep nfm without nfseId when client has no cityCodeIbge', async() => {
    // Arrange
    const base = await seedBase(prisma);
    await createClientWithConfig(prisma, base, 1, '00000000000101', {
      withItem: true,
      withCityCodeIbge: false,
    });

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.created).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0].clientId).toBe(1);
    const row = await prisma.nfm.findFirst();
    expect(row?.nfseId).toBeNull();
  });

  it('should retry issue when nfm exists without nfseId', async() => {
    // Arrange
    const base = await seedBase(prisma);
    await createClientWithConfig(prisma, base, 1, '00000000000101', {
      withItem: true,
      withCityCodeIbge: false,
    });
    const first = await sut.execute();
    expect(first.failed).toBe(1);

    await prisma.clientAddress.updateMany({
      where: { clientId: 1 },
      data: { cityCodeIbge: '3550308' },
    });

    // Act
    const second = await sut.execute();

    // Assert
    expect(second).toEqual({ created: 1, skipped: 0, failed: 0, errors: [] });
    const row = await prisma.nfm.findFirst();
    expect(row?.nfseId).not.toBeNull();
  });

  it('should not persist client without active items', async() => {
    // Arrange
    const base = await seedBase(prisma);
    await createClientWithConfig(prisma, base, 1, '00000000000101');

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual({ created: 0, skipped: 0, failed: 0, errors: [] });
    expect(await prisma.nfm.count()).toBe(0);
  });

  it('should not persist when generateNf is false', async() => {
    // Arrange
    const base = await seedBase(prisma);
    await createClientWithConfig(prisma, base, 1, '00000000000101', {
      generateNf: false,
      withItem: true,
    });

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.created).toBe(0);
    expect(await prisma.nfm.count()).toBe(0);
  });

  it('should not persist when dueDateDay is not today', async() => {
    // Arrange
    const base = await seedBase(prisma);
    await createClientWithConfig(prisma, base, 1, '00000000000101', {
      dueDateDay: NOT_TODAY,
      withItem: true,
    });

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.created).toBe(0);
    expect(await prisma.nfm.count()).toBe(0);
  });
});
