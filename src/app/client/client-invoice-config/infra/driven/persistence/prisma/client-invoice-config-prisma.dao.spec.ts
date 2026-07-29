import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceConfigDto } from 'src/app/client/client-invoice-config/application/dtos/client-invoice-config.dto';
import { FindAllClientInvoiceConfigQueryDto } from 'src/app/client/client-invoice-config/application/usecases/find-all-client-invoice-config/dtos/find-all-client-invoice-config.dto';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientInvoiceConfigDaoAdapterPrisma } from './client-invoice-config-prisma.dao';

describe('ClientInvoiceConfigDaoAdapterPrisma - Integration tests', () => {
  let sut: ClientInvoiceConfigDaoAdapterPrisma;
  let prisma: PrismaService;
  let clientId: number;
  let billingAddressId: number;
  let bankId: number;
  let clientRow: Awaited<ReturnType<PrismaService['client']['create']>>;
  let addressRow: Awaited<ReturnType<PrismaService['clientAddress']['create']>>;
  let bankRow: Awaited<ReturnType<PrismaService['bank']['create']>>;

  function expectedBillingAddressDto(): ClientInvoiceConfigDto['billingAddress'] {
    return {
      id: addressRow.id,
      clientId: clientRow.id,
      type: ClientAddressType.BILLING,
      zipCode: '12345-678',
      street: 'Rua Teste',
      number: '123',
      complement: null,
      neighborhood: 'Centro',
      city: 'São Paulo',
      cityCodeIbge: '3550308',
      state: 'SP',
      active: true,
      createdAt: addressRow.createdAt,
      updatedAt: addressRow.updatedAt,
    };
  }

  function expectedBankDto(): ClientInvoiceConfigDto['bank'] {
    return {
      id: bankRow.id,
      drawer: 'Test Drawer',
      wallet: '123',
      account: '12345',
      agency: '0001',
      bankCode: '001',
      bankName: 'Test Bank',
      paymentLocation: null,
      active: true,
      createdAt: bankRow.createdAt,
      updatedAt: bankRow.updatedAt,
    };
  }

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientInvoiceConfigDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ClientInvoiceConfigDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    clientRow = await prisma.client.create({
      data: {
        id: 1,
        type: ClientType.PJ,
        document: '09748165000110',
        ie: null,
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa Test',
        fantasyName: null,
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    addressRow = await prisma.clientAddress.create({
      data: {
        clientId: clientRow.id,
        type: ClientAddressType.BILLING,
        zipCode: '12345-678',
        street: 'Rua Teste',
        number: '123',
        complement: null,
        neighborhood: 'Centro',
        city: 'São Paulo',
        cityCodeIbge: '3550308',
        state: 'SP',
        active: true,
      },
    });

    bankRow = await prisma.bank.create({
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

    clientId = clientRow.id;
    billingAddressId = addressRow.id;
    bankId = bankRow.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  describe('findById', () => {
    it('should return null when config does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should map all columns from client_invoice_configs to DTO correctly', async() => {
      const created = await prisma.clientInvoiceConfig.create({
        data: {
          clientId,
          generateNf: true,
          type: ClientInvoiceConfigType.MONTHLY,
          emissionDay: 5,
          dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
          dueDateDay: 15,
          deadlineDays: null,
          months: [1, 2, 3],
          billingAddressId,
          bankId,
          autoProtestBoleto: false,
          message: 'Mensagem DAO',
        },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result).toEqual<ClientInvoiceConfigDto>({
        id: created.id,
        clientId,
        generateNf: true,
        type: ClientInvoiceConfigType.MONTHLY,
        emissionDay: 5,
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 15,
        deadlineDays: null,
        months: [1, 2, 3],
        dueMonth: null,
        billingAddress: expectedBillingAddressDto(),
        bank: expectedBankDto(),
        autoProtestBoleto: false,
        message: 'Mensagem DAO',
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });

    it('should map ANNUAL type with deadlineDays and null message correctly', async() => {
      const created = await prisma.clientInvoiceConfig.create({
        data: {
          clientId,
          generateNf: false,
          type: ClientInvoiceConfigType.ANNUAL,
          emissionDay: 1,
          dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
          dueDateDay: null,
          deadlineDays: 25,
          dueMonth: 12,
          months: [6, 12],
          billingAddressId,
          bankId,
          autoProtestBoleto: true,
          message: null,
        },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result).toEqual<ClientInvoiceConfigDto>({
        id: created.id,
        clientId,
        generateNf: false,
        type: ClientInvoiceConfigType.ANNUAL,
        emissionDay: 1,
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: 25,
        dueMonth: 12,
        months: [6, 12],
        billingAddress: expectedBillingAddressDto(),
        bank: expectedBankDto(),
        autoProtestBoleto: true,
        message: null,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findAll', () => {
    it('should return empty when no configs exist', async() => {
      const [rows, total] = await sut.findAll({});

      expect(rows).toEqual([]);
      expect(total).toBe(0);
    });

    it('should filter by dueDateDay', async() => {
      await prisma.clientInvoiceConfig.create({
        data: {
          clientId,
          generateNf: true,
          type: ClientInvoiceConfigType.MONTHLY,
          emissionDay: 5,
          dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
          dueDateDay: 12,
          deadlineDays: null,
          months: [],
          billingAddressId,
          bankId,
          autoProtestBoleto: false,
          message: null,
        },
      });

      const client2 = await prisma.client.create({
        data: {
          id: 2,
          type: ClientType.PJ,
          document: '09748165000121',
          ie: null,
          groupId: (await prisma.client.findUniqueOrThrow({ where: { id: clientId } })).groupId,
          resaleId: (await prisma.client.findUniqueOrThrow({ where: { id: clientId } })).resaleId,
          companyName: 'Empresa 2',
          fantasyName: null,
          headquarters: 'São Paulo',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const address2 = await prisma.clientAddress.create({
        data: {
          clientId: client2.id,
          type: ClientAddressType.BILLING,
          zipCode: '12345-678',
          street: 'Rua 2',
          number: '2',
          complement: null,
          neighborhood: 'Centro',
          city: 'São Paulo',
          cityCodeIbge: '3550308',
          state: 'SP',
          active: true,
        },
      });

      await prisma.clientInvoiceConfig.create({
        data: {
          clientId: client2.id,
          generateNf: true,
          type: ClientInvoiceConfigType.MONTHLY,
          emissionDay: 5,
          dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
          dueDateDay: 28,
          deadlineDays: null,
          months: [],
          billingAddressId: address2.id,
          bankId,
          autoProtestBoleto: false,
          message: null,
        },
      });

      const query: FindAllClientInvoiceConfigQueryDto = { dueDateDay: 12 };
      const [rows, total] = await sut.findAll(query);

      expect(total).toBe(1);
      expect(rows).toHaveLength(1);
      expect(rows[0].dueDateDay).toBe(12);
    });

    it('should filter by generateNf', async() => {
      await prisma.clientInvoiceConfig.create({
        data: {
          clientId,
          generateNf: true,
          type: ClientInvoiceConfigType.MONTHLY,
          emissionDay: 5,
          dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
          dueDateDay: 10,
          deadlineDays: null,
          months: [],
          billingAddressId,
          bankId,
          autoProtestBoleto: false,
          message: null,
        },
      });

      const client2 = await prisma.client.create({
        data: {
          id: 2,
          type: ClientType.PJ,
          document: '09748165000121',
          ie: null,
          groupId: (await prisma.client.findUniqueOrThrow({ where: { id: clientId } })).groupId,
          resaleId: (await prisma.client.findUniqueOrThrow({ where: { id: clientId } })).resaleId,
          companyName: 'Empresa 2',
          fantasyName: null,
          headquarters: 'São Paulo',
          invoiceType: ClientInvoiceType.CONTRACT,
          generateInvoice: true,
          active: true,
        },
      });

      const address2 = await prisma.clientAddress.create({
        data: {
          clientId: client2.id,
          type: ClientAddressType.BILLING,
          zipCode: '12345-678',
          street: 'Rua 2',
          number: '2',
          complement: null,
          neighborhood: 'Centro',
          city: 'São Paulo',
          cityCodeIbge: '3550308',
          state: 'SP',
          active: true,
        },
      });

      await prisma.clientInvoiceConfig.create({
        data: {
          clientId: client2.id,
          generateNf: false,
          type: ClientInvoiceConfigType.MONTHLY,
          emissionDay: 5,
          dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
          dueDateDay: 10,
          deadlineDays: null,
          months: [],
          billingAddressId: address2.id,
          bankId,
          autoProtestBoleto: false,
          message: null,
        },
      });

      const [onlyFalse, totalFalse] = await sut.findAll({ generateNf: false });
      const [onlyTrue, totalTrue] = await sut.findAll({ generateNf: true });

      expect(totalFalse).toBe(1);
      expect(onlyFalse[0].generateNf).toBe(false);
      expect(totalTrue).toBe(1);
      expect(onlyTrue[0].generateNf).toBe(true);
    });

    it('should search message case-insensitively', async() => {
      await prisma.clientInvoiceConfig.create({
        data: {
          clientId,
          generateNf: true,
          type: ClientInvoiceConfigType.MONTHLY,
          emissionDay: 5,
          dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
          dueDateDay: 10,
          deadlineDays: null,
          months: [],
          billingAddressId,
          bankId,
          autoProtestBoleto: false,
          message: 'Texto BOLETO especial',
        },
      });

      const [rows, total] = await sut.findAll({ search: 'boleto' });

      expect(total).toBe(1);
      expect(rows[0].message).toContain('BOLETO');
    });
  });

  describe('findByClientId', () => {
    it('should return null when no config exists for client', async() => {
      const result = await sut.findByClientId(clientId);

      expect(result).toBeNull();
    });

    it('should return DTO with all columns from client_invoice_configs by clientId', async() => {
      const created = await prisma.clientInvoiceConfig.create({
        data: {
          clientId,
          generateNf: true,
          type: ClientInvoiceConfigType.MONTHLY,
          emissionDay: 10,
          dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
          dueDateDay: 20,
          deadlineDays: null,
          months: [],
          billingAddressId,
          bankId,
          autoProtestBoleto: true,
          message: 'Config por clientId',
        },
      });

      const result = await sut.findByClientId(clientId);

      expect(result).not.toBeNull();
      expect(result).toEqual<ClientInvoiceConfigDto>({
        id: created.id,
        clientId,
        generateNf: true,
        type: ClientInvoiceConfigType.MONTHLY,
        emissionDay: 10,
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 20,
        dueMonth: null,
        deadlineDays: null,
        months: [],
        billingAddress: expectedBillingAddressDto(),
        bank: expectedBankDto(),
        autoProtestBoleto: true,
        message: 'Config por clientId',
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });
});
