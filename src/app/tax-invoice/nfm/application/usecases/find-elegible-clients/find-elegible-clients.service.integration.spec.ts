import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { NfmModule } from '../../../nfm.module';
import { FindElegibleClients } from './find-elegible-clients.service';

const TODAY = new Date().getDate();
const TOMORROW = TODAY < 28 ? TODAY + 1 : TODAY - 1;

type SeedBase = {
  groupId: number;
  resaleId: number;
  companyId: number;
  bankId: number;
  cnaeNbsIndopId: number;
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
    companyId: company.id,
    bankId: bank.id,
    cnaeNbsIndopId: cnaeNbsIndop.id,
  };
}

type CreateClientOpts = {
  clientId: number;
  document: string;
  invoiceType?: string;
  active?: boolean;
  generateInvoice?: boolean;
};

type CreateInvoiceConfigOpts = {
  dueDateDay: number;
  generateNf?: boolean;
};

async function createClientWithConfig(
  prisma: PrismaService,
  base: SeedBase,
  clientOpts: CreateClientOpts,
  configOpts: CreateInvoiceConfigOpts,
): Promise<void> {
  const { clientId, document, invoiceType = ClientInvoiceType.CONTRACT, active = true, generateInvoice = true } = clientOpts;
  const { dueDateDay, generateNf = true } = configOpts;

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
}

async function addClientItem(
  prisma: PrismaService,
  clientId: number,
  cnaeNbsIndopId: number,
  active: boolean,
): Promise<void> {
  await prisma.clientItem.create({
    data: {
      clientId,
      description: `Item ${clientId}-${active ? 'ativo' : 'inativo'}`,
      quantity: 1,
      unitValueInCents: 10000,
      cnaeNbsIndopId,
      active,
    },
  });
}

describe('FindElegibleClients - Integration tests', () => {
  let sut: FindElegibleClients;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [NfmModule],
    }).compile();

    sut = module.get(FindElegibleClients);
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

  it('should return empty array when no records exist', async() => {
    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual([]);
  });

  it('should return client that satisfies all filters (happy path)', async() => {
    // Arrange
    const base = await seedBase(prisma);
    await createClientWithConfig(
      prisma, base,
      { clientId: 1, document: '00000000000101' },
      { dueDateDay: TODAY, generateNf: true },
    );
    await addClientItem(prisma, 1, base.cnaeNbsIndopId, true);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].client.id).toBe(1);
    expect(result[0].clientInvoiceConfig.clientId).toBe(1);
    expect(result[0].client.invoiceType).toBe(ClientInvoiceType.CONTRACT);
    expect(result[0].client.active).toBe(true);
    expect(result[0].client.generateInvoice).toBe(true);
    expect(result[0].clientInvoiceConfig.generateNf).toBe(true);
    expect(result[0].clientInvoiceConfig.dueDateDay).toBe(TODAY);
    expect(result[0].clientItems).toHaveLength(1);
    expect(result[0].clientItems[0].active).toBe(true);
  });

  it('should NOT include client with dueDateDay different from today', async() => {
    // Arrange
    const base = await seedBase(prisma);
    await createClientWithConfig(
      prisma, base,
      { clientId: 1, document: '00000000000101' },
      { dueDateDay: TOMORROW, generateNf: true },
    );
    await addClientItem(prisma, 1, base.cnaeNbsIndopId, true);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual([]);
  });

  it('should NOT include client with generateNf=false', async() => {
    // Arrange
    const base = await seedBase(prisma);
    await createClientWithConfig(
      prisma, base,
      { clientId: 1, document: '00000000000101' },
      { dueDateDay: TODAY, generateNf: false },
    );
    await addClientItem(prisma, 1, base.cnaeNbsIndopId, true);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual([]);
  });

  it('should NOT include client with invoiceType=INDIVIDUAL (Avulso)', async() => {
    // Arrange
    const base = await seedBase(prisma);
    await createClientWithConfig(
      prisma, base,
      { clientId: 1, document: '00000000000101', invoiceType: ClientInvoiceType.INDIVIDUAL },
      { dueDateDay: TODAY, generateNf: true },
    );
    await addClientItem(prisma, 1, base.cnaeNbsIndopId, true);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual([]);
  });

  it('should NOT include client with active=false', async() => {
    // Arrange
    const base = await seedBase(prisma);
    await createClientWithConfig(
      prisma, base,
      { clientId: 1, document: '00000000000101', active: false },
      { dueDateDay: TODAY, generateNf: true },
    );
    await addClientItem(prisma, 1, base.cnaeNbsIndopId, true);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual([]);
  });

  it('should NOT include client with generateInvoice=false', async() => {
    // Arrange
    const base = await seedBase(prisma);
    await createClientWithConfig(
      prisma, base,
      { clientId: 1, document: '00000000000101', generateInvoice: false },
      { dueDateDay: TODAY, generateNf: true },
    );
    await addClientItem(prisma, 1, base.cnaeNbsIndopId, true);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual([]);
  });

  it('should NOT include client with empty clientItems when client has no items at all', async() => {
    // Arrange
    const base = await seedBase(prisma);
    await createClientWithConfig(
      prisma, base,
      { clientId: 1, document: '00000000000101' },
      { dueDateDay: TODAY, generateNf: true },
    );

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toHaveLength(0);
  });

  it('should NOT include client with empty clientItems when all items are inactive', async() => {
    // Arrange
    const base = await seedBase(prisma);
    await createClientWithConfig(
      prisma, base,
      { clientId: 1, document: '00000000000101' },
      { dueDateDay: TODAY, generateNf: true },
    );
    await addClientItem(prisma, 1, base.cnaeNbsIndopId, false);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toHaveLength(0);
  });

  it('should return every active item when client has multiple active items', async() => {
    // Arrange
    const base = await seedBase(prisma);
    await createClientWithConfig(
      prisma, base,
      { clientId: 1, document: '00000000000101' },
      { dueDateDay: TODAY, generateNf: true },
    );
    await addClientItem(prisma, 1, base.cnaeNbsIndopId, true);
    await addClientItem(prisma, 1, base.cnaeNbsIndopId, true);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].clientItems).toHaveLength(2);
    expect(result[0].clientItems.every(item => item.active)).toBe(true);
    expect(result[0].clientItems.every(item => item.clientId === 1)).toBe(true);
  });

  it('should return only active items when client has mix of active and inactive items', async() => {
    // Arrange
    const base = await seedBase(prisma);
    await createClientWithConfig(
      prisma, base,
      { clientId: 1, document: '00000000000101' },
      { dueDateDay: TODAY, generateNf: true },
    );
    await addClientItem(prisma, 1, base.cnaeNbsIndopId, true);
    await addClientItem(prisma, 1, base.cnaeNbsIndopId, false);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].clientItems).toHaveLength(1);
    expect(result[0].clientItems[0].active).toBe(true);
  });

  it('should return all eligible clients when multiple clients satisfy all filters', async() => {
    // Arrange
    const base = await seedBase(prisma);

    await createClientWithConfig(
      prisma, base,
      { clientId: 1, document: '00000000000101' },
      { dueDateDay: TODAY, generateNf: true },
    );
    await addClientItem(prisma, 1, base.cnaeNbsIndopId, true);

    await createClientWithConfig(
      prisma, base,
      { clientId: 2, document: '00000000000202' },
      { dueDateDay: TODAY, generateNf: true },
    );
    await addClientItem(prisma, 2, base.cnaeNbsIndopId, true);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toHaveLength(2);
    const ids = result.map(nfm => nfm.client.id).sort();
    expect(ids).toEqual([1, 2]);
    for (const nfm of result) {
      expect(nfm.clientInvoiceConfig.clientId).toBe(nfm.client.id);
    }
  });

  it('should return results ordered by client id ascending', async() => {
    // Arrange
    const base = await seedBase(prisma);

    await createClientWithConfig(
      prisma, base,
      { clientId: 10, document: '00000000001010' },
      { dueDateDay: TODAY, generateNf: true },
    );
    await addClientItem(prisma, 10, base.cnaeNbsIndopId, true);

    await createClientWithConfig(
      prisma, base,
      { clientId: 3, document: '00000000000303' },
      { dueDateDay: TODAY, generateNf: true },
    );
    await addClientItem(prisma, 3, base.cnaeNbsIndopId, true);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.map(nfm => nfm.client.id)).toEqual([3, 10]);
  });

  it('should omit eligible client without active items when another eligible client has active items', async() => {
    // Arrange
    const base = await seedBase(prisma);

    await createClientWithConfig(
      prisma, base,
      { clientId: 1, document: '00000000000101' },
      { dueDateDay: TODAY, generateNf: true },
    );
    await addClientItem(prisma, 1, base.cnaeNbsIndopId, true);

    await createClientWithConfig(
      prisma, base,
      { clientId: 2, document: '00000000000202' },
      { dueDateDay: TODAY, generateNf: true },
    );

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].client.id).toBe(1);
  });

  it('should only return eligible clients when mix of eligible and ineligible clients exist', async() => {
    // Arrange
    const base = await seedBase(prisma);

    // Eligible: dueDateDay=today, generateNf=true, CONTRACT, active, generateInvoice=true
    await createClientWithConfig(
      prisma, base,
      { clientId: 1, document: '00000000000101' },
      { dueDateDay: TODAY, generateNf: true },
    );
    await addClientItem(prisma, 1, base.cnaeNbsIndopId, true);

    // Ineligible: wrong due date day
    await createClientWithConfig(
      prisma, base,
      { clientId: 2, document: '00000000000202' },
      { dueDateDay: TOMORROW, generateNf: true },
    );
    await addClientItem(prisma, 2, base.cnaeNbsIndopId, true);

    // Ineligible: generateNf=false
    await createClientWithConfig(
      prisma, base,
      { clientId: 3, document: '00000000000303' },
      { dueDateDay: TODAY, generateNf: false },
    );
    await addClientItem(prisma, 3, base.cnaeNbsIndopId, true);

    // Ineligible: invoiceType=INDIVIDUAL
    await createClientWithConfig(
      prisma, base,
      { clientId: 4, document: '00000000000404', invoiceType: ClientInvoiceType.INDIVIDUAL },
      { dueDateDay: TODAY, generateNf: true },
    );
    await addClientItem(prisma, 4, base.cnaeNbsIndopId, true);

    // Ineligible: active=false
    await createClientWithConfig(
      prisma, base,
      { clientId: 5, document: '00000000000505', active: false },
      { dueDateDay: TODAY, generateNf: true },
    );
    await addClientItem(prisma, 5, base.cnaeNbsIndopId, true);

    // Ineligible: generateInvoice=false
    await createClientWithConfig(
      prisma, base,
      { clientId: 6, document: '00000000000606', generateInvoice: false },
      { dueDateDay: TODAY, generateNf: true },
    );
    await addClientItem(prisma, 6, base.cnaeNbsIndopId, true);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].client.id).toBe(1);
  });
});
