import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { NfmStatus } from 'src/app/tax-invoice/nfm/domain/enums/nfm-status.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
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
};

type SeedBase = {
  groupId: number;
  resaleId: number;
  bankId: number;
  cnaeNbsIndopId: number;
};

async function seedBase(prisma: PrismaService): Promise<SeedBase> {
  const [group, resale] = await Promise.all([
    prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
    prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
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

  const [cnae, nbs, indop] = await Promise.all([
    prisma.cnae.create({ data: { code: `C${Date.now()}`, description: 'CNAE Teste', active: true } }),
    prisma.nbs.create({ data: { code: `N${Date.now()}`, description: 'NBS Teste', active: true } }),
    prisma.indop.create({ data: { code: `I${Date.now()}`, description: 'INDOP Teste', active: true } }),
  ]);
  const cnaeNbsIndop = await prisma.cnaeNbsIndop.create({
    data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id, active: true },
  });

  return {
    groupId: group.id,
    resaleId: resale.id,
    bankId: bank.id,
    cnaeNbsIndopId: cnaeNbsIndop.id,
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
  } = options;

  const client = await prisma.client.create({
    data: {
      id: clientId,
      type: ClientType.PJ,
      document,
      ie: null,
      groupId: base.groupId,
      resaleId: base.resaleId,
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
      cityCodeIbge: '3550308',
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
): Promise<void> {
  await prisma.clientItem.create({
    data: {
      clientId,
      description: `Item ${clientId}`,
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

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [NfmModule],
    }).compile();

    sut = module.get(SaveElegibleNfms);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return created 0 when no elegible clients exist', async() => {
    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual({ created: 0 });
    expect(await prisma.nfm.count()).toBe(0);
  });

  it('should persist elegible nfms with snapshot and dedicated columns', async() => {
    // Arrange
    const base = await seedBase(prisma);
    await createClientWithConfig(prisma, base, 1, '00000000000101', { withItem: true });

    const now = new Date();
    const referenceMonth = now.getMonth() + 1;
    const referenceYear = now.getFullYear();

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual({ created: 1 });

    const rows = await prisma.nfm.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].clientId).toBe(1);
    expect(rows[0].clientDocument).toBe('00000000000101');
    expect(rows[0].companyName).toBe('Empresa 1');
    expect(rows[0].status).toBe(NfmStatus.PENDING);
    expect(rows[0].referenceMonth).toBe(referenceMonth);
    expect(rows[0].referenceYear).toBe(referenceYear);
    expect(rows[0].totalValueInCents).toBe(10000);
    expect(rows[0].data).toMatchObject({
      client: expect.objectContaining({ id: 1 }),
      clientInvoiceConfig: expect.objectContaining({ clientId: 1 }),
      clientItems: expect.arrayContaining([
        expect.objectContaining({ clientId: 1, active: true }),
      ]),
    });
  });

  it('should skip duplicates when executed twice in the same month', async() => {
    // Arrange
    const base = await seedBase(prisma);
    await createClientWithConfig(prisma, base, 1, '00000000000101', { withItem: true });

    // Act
    const first = await sut.execute();
    const second = await sut.execute();

    // Assert
    expect(first).toEqual({ created: 1 });
    expect(second).toEqual({ created: 0 });
    expect(await prisma.nfm.count()).toBe(1);
  });

  it('should persist multiple elegible clients in one execution', async() => {
    // Arrange
    const base = await seedBase(prisma);
    await createClientWithConfig(prisma, base, 1, '00000000000101', { withItem: true });
    await createClientWithConfig(prisma, base, 2, '00000000000202', { withItem: true });

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual({ created: 2 });
    expect(await prisma.nfm.count()).toBe(2);
  });

  it('should not persist client without active items', async() => {
    // Arrange
    const base = await seedBase(prisma);
    await createClientWithConfig(prisma, base, 1, '00000000000101');

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual({ created: 0 });
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
    expect(result).toEqual({ created: 0 });
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
    expect(result).toEqual({ created: 0 });
    expect(await prisma.nfm.count()).toBe(0);
  });

  it('should not persist inactive client', async() => {
    // Arrange
    const base = await seedBase(prisma);
    await createClientWithConfig(prisma, base, 1, '00000000000101', {
      active: false,
      withItem: true,
    });

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual({ created: 0 });
    expect(await prisma.nfm.count()).toBe(0);
  });

  it('should not persist client with generateInvoice false', async() => {
    // Arrange
    const base = await seedBase(prisma);
    await createClientWithConfig(prisma, base, 1, '00000000000101', {
      generateInvoice: false,
      withItem: true,
    });

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual({ created: 0 });
    expect(await prisma.nfm.count()).toBe(0);
  });

  it('should persist only missing client when one nfm already exists', async() => {
    // Arrange
    const base = await seedBase(prisma);
    await createClientWithConfig(prisma, base, 1, '00000000000101', { withItem: true });
    await createClientWithConfig(prisma, base, 2, '00000000000202', { withItem: true });

    const first = await sut.execute();
    await prisma.nfm.deleteMany({ where: { clientId: 2 } });

    // Act
    const second = await sut.execute();

    // Assert
    expect(first).toEqual({ created: 2 });
    expect(second).toEqual({ created: 1 });
    expect(await prisma.nfm.count()).toBe(2);
    const clientIds = (await prisma.nfm.findMany({ select: { clientId: true } }))
      .map(row => row.clientId)
      .sort();
    expect(clientIds).toEqual([1, 2]);
  });
});
