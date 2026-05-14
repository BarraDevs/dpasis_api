import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceConfigModule } from 'src/app/client/client-invoice-config/client-invoice-config.module';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { FindAllClientInvoiceConfigQueryDto } from './dtos/find-all-client-invoice-config.dto';
import { FindAllClientInvoiceConfig } from './find-all-client-invoice-config.service';

type SeedBase = {
  groupId: number;
  resaleId: number;
  bankId: number;
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
      account: '12345',
      agency: '0001',
      bankCode: '001',
      bankName: 'Test Bank',
      paymentLocation: null,
      active: true,
    },
  });

  return { groupId: group.id, resaleId: resale.id, bankId: bank.id };
}

async function createClientWithConfig(
  prisma: PrismaService,
  base: SeedBase,
  opts: {
    clientId: number;
    document: string;
    dueDateDay: number | null;
    dueDateType: ClientInvoiceConfigDueDateType;
    message: string | null;
    deadlineDays?: number | null;
    dueMonth?: number | null;
    generateNf?: boolean;
  },
): Promise<void> {
  const client = await prisma.client.create({
    data: {
      id: opts.clientId,
      type: ClientType.PJ,
      document: opts.document,
      ie: null,
      groupId: base.groupId,
      resaleId: base.resaleId,
      companyName: `Empresa ${opts.clientId}`,
      fantasyName: null,
      headquarters: 'São Paulo',
      invoiceType: ClientInvoiceType.CONTRACT,
      generateInvoice: true,
      active: true,
    },
  });

  const address = await prisma.clientAddress.create({
    data: {
      clientId: client.id,
      type: ClientAddressType.BILLING,
      zipCode: '12345-678',
      street: 'Rua Teste',
      number: String(opts.clientId),
      complement: null,
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      active: true,
    },
  });

  await prisma.clientInvoiceConfig.create({
    data: {
      clientId: client.id,
      generateNf: opts.generateNf ?? true,
      type: ClientInvoiceConfigType.MONTHLY,
      emissionDay: 5,
      dueDateType: opts.dueDateType,
      dueDateDay: opts.dueDateDay,
      deadlineDays: opts.deadlineDays ?? null,
      dueMonth: opts.dueMonth ?? null,
      months: [],
      billingAddressId: address.id,
      bankId: base.bankId,
      autoProtestBoleto: false,
      message: opts.message,
    },
  });
}

describe('FindAllClientInvoiceConfig - Integration tests', () => {
  let sut: FindAllClientInvoiceConfig;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientInvoiceConfigModule],
    }).compile();

    sut = module.get(FindAllClientInvoiceConfig);
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

  it('should return empty when no configs exist', async() => {
    const result = await sut.execute({});

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all configs with pagination', async() => {
    const base = await seedBase(prisma);
    await createClientWithConfig(prisma, base, {
      clientId: 1,
      document: '09748165000110',
      dueDateDay: 10,
      dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
      message: 'Um',
    });
    await createClientWithConfig(prisma, base, {
      clientId: 2,
      document: '09748165000121',
      dueDateDay: 20,
      dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
      message: 'Dois',
    });
    await createClientWithConfig(prisma, base, {
      clientId: 3,
      document: '09748165000132',
      dueDateDay: 25,
      dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
      message: 'Três',
    });

    const page1 = await sut.execute({ page: 1, size: 2 });
    const page2 = await sut.execute({ page: 2, size: 2 });

    expect(page1.data).toHaveLength(2);
    expect(page1.totalItems).toBe(3);
    expect(page2.data).toHaveLength(1);
    expect(page2.totalItems).toBe(3);
  });

  it('should filter by dueDateDay', async() => {
    const base = await seedBase(prisma);
    await createClientWithConfig(prisma, base, {
      clientId: 1,
      document: '09748165000110',
      dueDateDay: 15,
      dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
      message: 'A',
    });
    await createClientWithConfig(prisma, base, {
      clientId: 2,
      document: '09748165000121',
      dueDateDay: 20,
      dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
      message: 'B',
    });

    const query: FindAllClientInvoiceConfigQueryDto = { dueDateDay: 15 };
    const result = await sut.execute(query);

    expect(result.totalItems).toBe(1);
    expect(result.data[0].dueDateDay).toBe(15);
  });

  it('should filter by generateNf', async() => {
    const base = await seedBase(prisma);
    await createClientWithConfig(prisma, base, {
      clientId: 1,
      document: '09748165000110',
      dueDateDay: 10,
      dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
      message: 'Com NF',
      generateNf: true,
    });
    await createClientWithConfig(prisma, base, {
      clientId: 2,
      document: '09748165000121',
      dueDateDay: 10,
      dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
      message: 'Sem NF',
      generateNf: false,
    });

    const onlyWithoutNf = await sut.execute({ generateNf: false });
    const onlyWithNf = await sut.execute({ generateNf: true });

    expect(onlyWithoutNf.totalItems).toBe(1);
    expect(onlyWithoutNf.data[0].generateNf).toBe(false);
    expect(onlyWithNf.totalItems).toBe(1);
    expect(onlyWithNf.data[0].generateNf).toBe(true);
  });

  it('should filter by search on message', async() => {
    const base = await seedBase(prisma);
    await createClientWithConfig(prisma, base, {
      clientId: 1,
      document: '09748165000110',
      dueDateDay: 10,
      dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
      message: 'Nota fiscal especial',
    });
    await createClientWithConfig(prisma, base, {
      clientId: 2,
      document: '09748165000121',
      dueDateDay: 11,
      dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
      message: 'Outro texto',
    });

    const result = await sut.execute({ search: 'especial' });

    expect(result.totalItems).toBe(1);
    expect(result.data[0].message).toContain('especial');
  });

  it('should ignore active query param (no column on model)', async() => {
    const base = await seedBase(prisma);
    await createClientWithConfig(prisma, base, {
      clientId: 1,
      document: '09748165000110',
      dueDateDay: 10,
      dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
      message: null,
    });

    const withActiveFalse = await sut.execute({ active: false });
    const withActiveTrue = await sut.execute({ active: true });

    expect(withActiveFalse.totalItems).toBe(1);
    expect(withActiveTrue.totalItems).toBe(1);
  });
});
