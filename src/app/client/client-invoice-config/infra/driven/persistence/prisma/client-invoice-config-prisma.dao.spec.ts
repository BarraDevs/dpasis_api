import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceConfigDto } from 'src/app/client/client-invoice-config/application/dtos/client-invoice-config.dto';
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

    const client = await prisma.client.create({
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
        active: true,
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
        billingAddressId,
        bankId,
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
        billingAddressId,
        bankId,
        autoProtestBoleto: true,
        message: null,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
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
        billingAddressId,
        bankId,
        autoProtestBoleto: true,
        message: 'Config por clientId',
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });
});
