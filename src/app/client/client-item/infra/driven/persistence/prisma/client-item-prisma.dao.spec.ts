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
  });

  describe('findById', () => {
    it('should return null when client item does not exist', async() => {
      const result = await sut.findById(99999);

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
