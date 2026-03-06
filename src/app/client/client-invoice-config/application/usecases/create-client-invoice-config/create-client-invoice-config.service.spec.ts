import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { BillingAddressNotFromClientError } from 'src/app/client/client-address/domain/errors/billing-address-not-from-client.error';
import { ClientInvoiceConfigModule } from 'src/app/client/client-invoice-config/client-invoice-config.module';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { ClientInvoiceConfigAlreadyExistsError } from 'src/app/client/client-invoice-config/domain/errors/client-invoice-config-already-exists.error';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateClientInvoiceConfig } from './create-client-invoice-config.service';

function makeValidInput(overrides?: Record<string, unknown>) {
  return {
    clientId: 0,
    generateNf: true,
    type: ClientInvoiceConfigType.MONTHLY,
    emissionDay: 5,
    dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
    dueDateDay: 15,
    months: [] as number[],
    billingAddressId: 0,
    bankId: 0,
    autoProtestBoleto: false,
    message: null as string | null,
    ...overrides,
  };
}

describe('CreateClientInvoiceConfig', () => {
  let sut: CreateClientInvoiceConfig;
  let prisma: PrismaService;
  let clientId: number;
  let billingAddressId: number;
  let bankId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientInvoiceConfigModule],
    }).compile();

    sut = module.get(CreateClientInvoiceConfig);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);

    const client = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '09748165000110',
        ie: null,
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Empresa Test',
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
        number: '123',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
      },
    });

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

    clientId = client.id;
    billingAddressId = address.id;
    bankId = bank.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should create config and return id', async() => {
    const input = makeValidInput({ clientId, billingAddressId, bankId });

    const result = await sut.execute(input);

    expect(result).toEqual({ id: expect.any(Number) });

    const saved = await prisma.clientInvoiceConfig.findUnique({
      where: { id: result.id },
    });
    expect(saved).not.toBeNull();
    expect(saved?.clientId).toBe(clientId);
    expect(saved?.generateNf).toBe(true);
    expect(saved?.type).toBe(ClientInvoiceConfigType.MONTHLY);
    expect(saved?.emissionDay).toBe(5);
    expect(saved?.dueDateType).toBe(ClientInvoiceConfigDueDateType.DUE_DATE);
    expect(saved?.dueDateDay).toBe(15);
    expect(saved?.billingAddressId).toBe(billingAddressId);
    expect(saved?.bankId).toBe(bankId);
  });

  it('should create config with ANNUAL type and months', async() => {
    const input = makeValidInput({
      clientId,
      billingAddressId,
      bankId,
      type: ClientInvoiceConfigType.ANNUAL,
      months: [1, 5, 9],
      dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
      dueDateDay: undefined,
      deadlineDays: 10,
    });

    const result = await sut.execute(input);

    const saved = await prisma.clientInvoiceConfig.findUnique({
      where: { id: result.id },
    });
    expect(saved?.type).toBe(ClientInvoiceConfigType.ANNUAL);
    expect(saved?.months).toEqual([1, 5, 9]);
    expect(saved?.deadlineDays).toBe(10);
    expect(saved?.dueDateDay).toBeNull();
  });

  it('should throw ClientInvoiceConfigAlreadyExistsError when config already exists for client', async() => {
    const input = makeValidInput({ clientId, billingAddressId, bankId });

    await sut.execute(input);

    await expect(sut.execute(input)).rejects.toThrow(ClientInvoiceConfigAlreadyExistsError);
  });

  it('should throw BillingAddressNotFromClientError when address does not belong to client', async() => {
    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo2 ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner2 ${Date.now()}`, active: true } }),
    ]);

    const otherClient = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '11111111000111',
        ie: null,
        groupId: group.id,
        ownerId: owner.id,
        companyName: 'Outra Empresa',
        fantasyName: null,
        headquarters: 'Rio',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    const otherAddress = await prisma.clientAddress.create({
      data: {
        clientId: otherClient.id,
        type: ClientAddressType.MAIN,
        zipCode: '98765-432',
        street: 'Av. Outra',
        number: '456',
        complement: null,
        neighborhood: 'Centro',
        city: 'Rio',
        state: 'RJ',
      },
    });

    const input = makeValidInput({
      clientId,
      billingAddressId: otherAddress.id,
      bankId,
    });

    await expect(sut.execute(input)).rejects.toThrow(BillingAddressNotFromClientError);
  });
});
