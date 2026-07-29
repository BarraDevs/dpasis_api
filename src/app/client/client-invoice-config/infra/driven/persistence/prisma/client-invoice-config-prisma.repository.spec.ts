import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ClientAddressType } from 'src/app/client/client-address/domain/enums/client-address-type.enum';
import { ClientInvoiceConfigProps } from 'src/app/client/client-invoice-config/domain/entities/client-invoice-config.entity';
import { ClientInvoiceConfigDueDateType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-due-date-type.enum';
import { ClientInvoiceConfigType } from 'src/app/client/client-invoice-config/domain/enums/client-invoice-config-type.enum';
import { ClientInvoiceConfigFactory } from 'src/app/client/client-invoice-config/domain/factories/client-invoice-config.factory';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientInvoiceConfigRepositoryAdapterPrisma } from './client-invoice-config-prisma.repository';

describe('ClientInvoiceConfigRepositoryAdapterPrisma - Integration tests', () => {
  let sut: ClientInvoiceConfigRepositoryAdapterPrisma;
  let prisma: PrismaService;
  let clientId: number;
  let billingAddressId: number;
  let bankId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientInvoiceConfigRepositoryAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ClientInvoiceConfigRepositoryAdapterPrisma);
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
        cityCodeIbge: '3550308',
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

  describe('save', () => {
    it('should persist entity in client_invoice_configs table with all columns correctly', async() => {
      const entity = ClientInvoiceConfigFactory.create({
        clientId,
        generateNf: true,
        type: ClientInvoiceConfigType.MONTHLY,
        emissionDay: 5,
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 20,
        dueMonth: 5,
        deadlineDays: null,
        months: [],
        billingAddressId,
        bankId,
        autoProtestBoleto: false,
        message: 'Mensagem de teste',
      });

      const id = await sut.save(entity);

      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.clientInvoiceConfig.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved).toEqual({
        id: expect.any(Number),
        clientId,
        generateNf: true,
        type: ClientInvoiceConfigType.MONTHLY,
        emissionDay: 5,
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 20,
        dueMonth: 5,
        deadlineDays: null,
        months: [],
        billingAddressId,
        bankId,
        autoProtestBoleto: false,
        message: 'Mensagem de teste',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should persist ANNUAL type with months and deadlineDays in correct columns', async() => {
      const entity = ClientInvoiceConfigFactory.create({
        clientId,
        generateNf: false,
        type: ClientInvoiceConfigType.ANNUAL,
        emissionDay: 1,
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        dueMonth: null,
        deadlineDays: 10,
        months: [1, 5, 9],
        billingAddressId,
        bankId,
        autoProtestBoleto: true,
        message: null,
      });

      const id = await sut.save(entity);

      const saved = await prisma.clientInvoiceConfig.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved).toEqual({
        id: expect.any(Number),
        clientId,
        generateNf: false,
        type: ClientInvoiceConfigType.ANNUAL,
        emissionDay: 1,
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        dueMonth: null,
        deadlineDays: 10,
        months: [1, 5, 9],
        billingAddressId,
        bankId,
        autoProtestBoleto: true,
        message: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('edit', () => {
    it('should update all columns in client_invoice_configs table', async() => {
      const entity = ClientInvoiceConfigFactory.create({
        clientId,
        generateNf: true,
        type: ClientInvoiceConfigType.MONTHLY,
        emissionDay: 5,
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 25,
        deadlineDays: null,
        dueMonth: 2,
        months: [],
        billingAddressId,
        bankId,
        autoProtestBoleto: false,
        message: 'Original',
      });

      const id = await sut.save(entity);
      const loaded = await sut.findById(id)!;

      const updated = ClientInvoiceConfigFactory.edit({
        ...loaded!.props,
        generateNf: false,
        type: ClientInvoiceConfigType.ANNUAL,
        emissionDay: 10,
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        dueMonth: 12,
        deadlineDays: 30,
        months: [3, 6, 12],
        autoProtestBoleto: true,
        message: 'Atualizado',
      });

      await sut.edit(updated);

      const saved = await prisma.clientInvoiceConfig.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved).toEqual({
        id,
        clientId,
        generateNf: false,
        type: ClientInvoiceConfigType.ANNUAL,
        emissionDay: 10,
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        dueMonth: null,
        deadlineDays: 30,
        months: [3, 6, 12],
        billingAddressId,
        bankId,
        autoProtestBoleto: true,
        message: 'Atualizado',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('findById', () => {
    it('should return null when config does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should return entity with all props from client_invoice_configs', async() => {
      const created = await prisma.clientInvoiceConfig.create({
        data: {
          clientId,
          generateNf: true,
          type: ClientInvoiceConfigType.MONTHLY,
          emissionDay: 5,
          dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
          dueDateDay: 15,
          deadlineDays: null,
          months: [1, 2],
          billingAddressId,
          bankId,
          autoProtestBoleto: false,
          message: 'Teste findById',
        },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.props).toEqual<ClientInvoiceConfigProps>({
        id: created.id,
        clientId,
        generateNf: true,
        type: ClientInvoiceConfigType.MONTHLY,
        emissionDay: 5,
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 15,
        deadlineDays: null,
        dueMonth: null,
        months: [1, 2],
        billingAddressId,
        bankId,
        autoProtestBoleto: false,
        message: 'Teste findById',
      });
    });
  });

  describe('findByClientId', () => {
    it('should return null when no config exists for client', async() => {
      const result = await sut.findByClientId(clientId);

      expect(result).toBeNull();
    });

    it('should return entity by clientId from client_invoice_configs', async() => {
      const created = await prisma.clientInvoiceConfig.create({
        data: {
          clientId,
          generateNf: false,
          type: ClientInvoiceConfigType.ANNUAL,
          emissionDay: 1,
          dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
          dueDateDay: null,
          deadlineDays: 30,
          months: [6, 12],
          billingAddressId,
          bankId,
          autoProtestBoleto: true,
          message: null,
        },
      });

      const result = await sut.findByClientId(clientId);

      expect(result).not.toBeNull();
      expect(result?.props).toEqual<ClientInvoiceConfigProps>({
        id: created.id,
        clientId,
        generateNf: false,
        type: ClientInvoiceConfigType.ANNUAL,
        emissionDay: 1,
        dueDateType: ClientInvoiceConfigDueDateType.DEADLINE,
        dueDateDay: null,
        deadlineDays: 30,
        dueMonth: null,
        months: [6, 12],
        billingAddressId,
        bankId,
        autoProtestBoleto: true,
        message: null,
      });
    });
  });

  describe('delete', () => {
    it('should remove record from client_invoice_configs table', async() => {
      const entity = ClientInvoiceConfigFactory.create({
        clientId,
        generateNf: true,
        type: ClientInvoiceConfigType.MONTHLY,
        emissionDay: 5,
        dueDateType: ClientInvoiceConfigDueDateType.DUE_DATE,
        dueDateDay: 25,
        dueMonth: 12,
        deadlineDays: null,
        months: [],
        billingAddressId,
        bankId,
        autoProtestBoleto: false,
        message: null,
      });

      const id = await sut.save(entity);
      await sut.delete(id);

      const deleted = await prisma.clientInvoiceConfig.findUnique({ where: { id } });
      expect(deleted).toBeNull();
    });
  });
});
