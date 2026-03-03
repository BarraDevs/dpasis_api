import { Test } from '@nestjs/testing';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientItemDaoAdapterPrisma } from './client-item-prisma.dao';

describe('ClientItemDaoAdapterPrisma - Integration tests', () => {
  let sut: ClientItemDaoAdapterPrisma;
  let prisma: PrismaService;
  let clientId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientItemDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ClientItemDaoAdapterPrisma);
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

    clientId = client.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  describe('findAll', () => {
    it('should return empty array when no client items exist', async() => {
      const [items, total] = await sut.findAll({ clientId });

      expect(items).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return client items with default pagination', async() => {
      await prisma.clientItem.createMany({
        data: [
          {
            clientId,
            description: 'Item 1',
            quantity: 11,
            unitValueInCents: 10000,
            cnae: '1234567',
            nbs: '12345678',
            indop: '1',
          },
          {
            clientId,
            description: 'Item 2',
            quantity: 2,
            unitValueInCents: 5000,
            cnae: '1234567',
            nbs: '12345678',
            indop: '1',
          },
        ],
      });

      const [items, total] = await sut.findAll({ clientId });

      expect(items).toHaveLength(2);
      expect(total).toBe(2);
      expect(items[0].totalValueInCents).toBe(110000);
      expect(items[1].totalValueInCents).toBe(10000);
    });

    it('should respect pagination with page and size', async() => {
      await prisma.clientItem.createMany({
        data: [
          {
            clientId,
            description: 'Item 1',
            quantity: 1,
            unitValueInCents: 10000,
            cnae: '1234567',
            nbs: '12345678',
            indop: '1',
          },
          {
            clientId,
            description: 'Item 2',
            quantity: 1,
            unitValueInCents: 5000,
            cnae: '1234567',
            nbs: '12345678',
            indop: '1',
          },
          {
            clientId,
            description: 'Item 3',
            quantity: 1,
            unitValueInCents: 7500,
            cnae: '1234567',
            nbs: '12345678',
            indop: '1',
          },
        ],
      });

      const [items, total] = await sut.findAll({ clientId, page: 1, size: 2 });

      expect(items).toHaveLength(2);
      expect(total).toBe(3);
    });

    it('should return empty when clientId has no items', async() => {
      const [items, total] = await sut.findAll({ clientId: 99999 });

      expect(items).toEqual([]);
      expect(total).toBe(0);
    });

    it('should search in description (case-insensitive)', async() => {
      await prisma.clientItem.create({
        data: {
          clientId,
          description: 'Serviço de consultoria',
          quantity: 1,
          unitValueInCents: 10000,
          cnae: '1234567',
          nbs: '12345678',
          indop: '1',
        },
      });
      await prisma.clientItem.create({
        data: {
          clientId,
          description: 'Produto XYZ',
          quantity: 1,
          unitValueInCents: 5000,
          cnae: '1234567',
          nbs: '12345678',
          indop: '1',
        },
      });

      const [items, total] = await sut.findAll({ clientId, search: 'CONSULTORIA' });

      expect(items).toHaveLength(1);
      expect(total).toBe(1);
      expect(items[0].description).toBe('Serviço de consultoria');
    });

    it('should search in cnae (case-insensitive)', async() => {
      await prisma.clientItem.create({
        data: {
          clientId,
          description: 'Item A',
          quantity: 1,
          unitValueInCents: 10000,
          cnae: '6201501',
          nbs: '12345678',
          indop: '1',
        },
      });
      await prisma.clientItem.create({
        data: {
          clientId,
          description: 'Item B',
          quantity: 1,
          unitValueInCents: 5000,
          cnae: '4712100',
          nbs: '12345678',
          indop: '1',
        },
      });

      const [items] = await sut.findAll({ clientId, search: '6201501' });

      expect(items).toHaveLength(1);
      expect(items[0].cnae).toBe('6201501');
    });

    it('should search in nbs (case-insensitive)', async() => {
      await prisma.clientItem.create({
        data: {
          clientId,
          description: 'Item A',
          quantity: 1,
          unitValueInCents: 10000,
          cnae: '1234567',
          nbs: '01010101',
          indop: '1',
        },
      });
      await prisma.clientItem.create({
        data: {
          clientId,
          description: 'Item B',
          quantity: 1,
          unitValueInCents: 5000,
          cnae: '1234567',
          nbs: '99999999',
          indop: '1',
        },
      });

      const [items] = await sut.findAll({ clientId, search: '01010101' });

      expect(items).toHaveLength(1);
      expect(items[0].nbs).toBe('01010101');
    });

    it('should search in indop (case-insensitive)', async() => {
      await prisma.clientItem.create({
        data: {
          clientId,
          description: 'Item A',
          quantity: 1,
          unitValueInCents: 10000,
          cnae: '1234567',
          nbs: '12345678',
          indop: 'INDOP-X',
        },
      });
      await prisma.clientItem.create({
        data: {
          clientId,
          description: 'Item B',
          quantity: 1,
          unitValueInCents: 5000,
          cnae: '1234567',
          nbs: '12345678',
          indop: 'INDOP-Y',
        },
      });

      const [items] = await sut.findAll({ clientId, search: 'indop-x' });

      expect(items).toHaveLength(1);
      expect(items[0].indop).toBe('INDOP-X');
    });
  });

  describe('findById', () => {
    it('should return null when client item does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should return null when id is 0', async() => {
      const result = await sut.findById(0);

      expect(result).toBeNull();
    });

    it('should return null when id is negative', async() => {
      const result = await sut.findById(-1);

      expect(result).toBeNull();
    });

    it('should return client item by id with calculated total', async() => {
      const created = await prisma.clientItem.create({
        data: {
          clientId,
          description: 'Item de teste',
          quantity: 3,
          unitValueInCents: 5000,
          cnae: '1234567',
          nbs: '12345678',
          indop: '1',
        },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.description).toBe(created.description);
      expect(result?.quantity).toBe(created.quantity);
      expect(result?.unitValueInCents).toBe(created.unitValueInCents);
      expect(result?.totalValueInCents).toBe(3 * 5000);
    });

    it('should calculate totalValueInCents as zero when quantity is zero', async() => {
      const created = await prisma.clientItem.create({
        data: {
          clientId,
          description: 'Item qty zero',
          quantity: 0,
          unitValueInCents: 10000,
          cnae: '1234567',
          nbs: '12345678',
          indop: '1',
        },
      });

      const result = await sut.findById(created.id);

      expect(result?.totalValueInCents).toBe(0);
    });

    it('should return all DTO fields including createdAt and updatedAt', async() => {
      const created = await prisma.clientItem.create({
        data: {
          clientId,
          description: 'Item completo',
          quantity: 2,
          unitValueInCents: 5000,
          cnae: '6201501',
          nbs: '01010101',
          indop: '1',
        },
      });

      const result = await sut.findById(created.id);

      expect(result).toMatchObject({
        id: created.id,
        clientId: created.clientId,
        description: created.description,
        quantity: created.quantity,
        unitValueInCents: created.unitValueInCents,
        totalValueInCents: 10000,
        cnae: created.cnae,
        nbs: created.nbs,
        indop: created.indop,
      });
      expect(result?.createdAt).toBeDefined();
      expect(result?.updatedAt).toBeDefined();
    });
  });

  describe('totalValueInCents rounding (Math.ceil)', () => {
    afterEach(() => jest.restoreAllMocks());

    const createMockRow = (overrides: Record<string, unknown>) => ({
      id: 1,
      clientId,
      description: 'Item teste',
      quantity: 1,
      unitValueInCents: 100,
      cnae: '1234567',
      nbs: '12345678',
      indop: '1',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });

    it('should round up totalValueInCents when multiplication has decimal (findById)', async() => {
      const mockRow = createMockRow({
        quantity: 1.5,
        unitValueInCents: 33.34,
      });
      // 1.5 * 33.34 = 50.01 → Math.ceil = 51
      jest.spyOn(prisma.clientItem, 'findUnique').mockResolvedValue(mockRow as never);

      const result = await sut.findById(1);

      expect(result?.totalValueInCents).toBe(51);
    });

    it('should round up totalValueInCents when multiplication has decimal (findAll)', async() => {
      const mockRow = createMockRow({
        quantity: 2.7,
        unitValueInCents: 10.5,
      });
      // 2.7 * 10.5 = 28.35 → Math.ceil = 29
      jest.spyOn(prisma, '$transaction').mockResolvedValue([[mockRow], 1] as never);

      const [items] = await sut.findAll({ clientId });

      expect(items[0].totalValueInCents).toBe(29);
    });

    it('should keep integer totalValueInCents when multiplication is exact', async() => {
      const mockRow = createMockRow({
        quantity: 10,
        unitValueInCents: 100,
      });
      // 10 * 100 = 1000 (exact)
      jest.spyOn(prisma.clientItem, 'findUnique').mockResolvedValue(mockRow as never);

      const result = await sut.findById(1);

      expect(result?.totalValueInCents).toBe(1000);
    });
  });
});
