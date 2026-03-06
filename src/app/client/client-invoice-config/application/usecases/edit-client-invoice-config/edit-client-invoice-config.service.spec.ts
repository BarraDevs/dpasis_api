import { Test } from '@nestjs/testing';
import { BankNotFoundError } from 'src/app/bank/domain/errors/bank-not-found.error';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientAddressNotFoundError } from 'src/app/client/client-address/domain/errors/client-address-not-found.error';
import { ClientInvoiceConfigModule } from 'src/app/client/client-invoice-config/client-invoice-config.module';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { ClientInvoiceConfigNotFoundError } from 'src/app/client/client-invoice-config/domain/errors/client-invoice-config-not-found.error';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EditClientInvoiceConfigInputDto } from './dtos/edit-client-invoice-config.dto';
import { EditClientInvoiceConfig } from './edit-client-invoice-config.service';

describe('EditClientInvoiceConfig - Integration tests', () => {
  let sut: EditClientInvoiceConfig;
  let prisma: PrismaService;
  let clientId: number;
  let configId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientInvoiceConfigModule],
    }).compile();

    sut = module.get(EditClientInvoiceConfig);
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

    const config = await prisma.clientInvoiceConfig.create({
      data: {
        clientId: client.id,
        generateNf: true,
        type: ClientInvoiceConfigType.MONTHLY,
        emissionDay: 5,
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 15,
        deadlineDays: null,
        months: [],
        billingAddressId: address.id,
        bankId: bank.id,
        autoProtestBoleto: false,
        message: 'Original',
      },
    });

    clientId = client.id;
    configId = config.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw ClientInvoiceConfigNotFoundError when config does not exist', async() => {
    const data: EditClientInvoiceConfigInputDto = {
      generateNf: false,
    };

    await expect(sut.execute(99999, data)).rejects.toThrow(ClientInvoiceConfigNotFoundError);
  });

  it('should update config and persist in database', async() => {
    const data: EditClientInvoiceConfigInputDto = {
      generateNf: false,
      type: ClientInvoiceConfigType.ANNUAL,
      emissionDay: 10,
      dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
      dueDateDay: undefined,
      deadlineDays: 20,
      months: [3, 6, 12],
      autoProtestBoleto: true,
      message: 'Atualizado',
    };

    await sut.execute(configId, data);

    const updated = await prisma.clientInvoiceConfig.findUnique({
      where: { id: configId },
    });
    expect(updated?.generateNf).toBe(false);
    expect(updated?.type).toBe(ClientInvoiceConfigType.ANNUAL);
    expect(updated?.emissionDay).toBe(10);
    expect(updated?.dueDateType).toBe(ClientInvoiceConfigDueDateType.DEADLINE);
    expect(updated?.dueDateDay).toBeNull();
    expect(updated?.deadlineDays).toBe(20);
    expect(updated?.months).toEqual([3, 6, 12]);
    expect(updated?.autoProtestBoleto).toBe(true);
    expect(updated?.message).toBe('Atualizado');
  });

  it('should return success message', async() => {
    const data: EditClientInvoiceConfigInputDto = {
      message: 'Nova mensagem',
    };

    const result = await sut.execute(configId, data);

    expect(result).toEqual({ message: 'Edição realizada com sucesso' });
  });

  it('should allow partial update (only some fields)', async() => {
    const data: EditClientInvoiceConfigInputDto = {
      generateNf: false,
    };

    await sut.execute(configId, data);

    const updated = await prisma.clientInvoiceConfig.findUnique({
      where: { id: configId },
    });
    expect(updated?.generateNf).toBe(false);
    expect(updated?.type).toBe(ClientInvoiceConfigType.MONTHLY);
    expect(updated?.emissionDay).toBe(5);
  });

  it('should throw BankNotFoundError when bankId does not exist', async() => {
    const data: EditClientInvoiceConfigInputDto = {
      bankId: 99999,
    };

    await expect(sut.execute(configId, data)).rejects.toThrow(BankNotFoundError);
  });

  it('should throw BankNotFoundError when bankId is inactive', async() => {
    const inactiveBank = await prisma.bank.create({
      data: {
        drawer: 'Inactive Drawer',
        wallet: '456',
        account: '67890',
        agency: '0002',
        bankCode: '002',
        bankName: 'Inactive Bank',
        paymentLocation: null,
        active: false,
      },
    });
    const data: EditClientInvoiceConfigInputDto = {
      bankId: inactiveBank.id,
    };

    await expect(sut.execute(configId, data)).rejects.toThrow(BankNotFoundError);
  });

  it('should throw BillingAddressNotFromClientError when billingAddressId does not belong to client', async() => {
    const [group2, owner2] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo2 ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner2 ${Date.now()}`, active: true } }),
    ]);

    const otherClient = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '11111111000111',
        ie: null,
        groupId: group2.id,
        ownerId: owner2.id,
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

    const data: EditClientInvoiceConfigInputDto = {
      billingAddressId: otherAddress.id,
    };

    await expect(sut.execute(configId, data)).rejects.toThrow(ClientAddressNotFoundError);
  });

  it('should accept billingAddressId from same client', async() => {
    const secondAddress = await prisma.clientAddress.create({
      data: {
        clientId,
        type: ClientAddressType.MAIN,
        zipCode: '98765-432',
        street: 'Av. Secundária',
        number: '456',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
      },
    });

    const data: EditClientInvoiceConfigInputDto = {
      billingAddressId: secondAddress.id,
    };

    await sut.execute(configId, data);

    const updated = await prisma.clientInvoiceConfig.findUnique({
      where: { id: configId },
    });
    expect(updated?.billingAddressId).toBe(secondAddress.id);
  });
});
