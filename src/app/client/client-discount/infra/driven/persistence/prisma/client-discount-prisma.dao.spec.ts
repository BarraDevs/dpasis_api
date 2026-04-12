import { Test } from '@nestjs/testing';
import { DiscountType } from 'src/app/client/client-discount/domain/enums/discount-type.enum';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDiscountDaoAdapterPrisma } from './client-discount-prisma.dao';

describe('ClientDiscountDaoAdapterPrisma - Integration tests', () => {
  let sut: ClientDiscountDaoAdapterPrisma;
  let prisma: PrismaService;
  let clientId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientDiscountDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ClientDiscountDaoAdapterPrisma);
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
        id: 1,
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
    it('should return empty array when no discounts exist', async() => {
      const [discounts, total] = await sut.findAll({ clientId });

      expect(discounts).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return discounts with correct DTO format', async() => {
      const created = await prisma.clientDiscount.create({
        data: {
          clientId,
          description: 'Desconto 10%',
          type: DiscountType.PERCENTAGE,
          discountValue: 1000,
          month: 3,
          year: 2026,
          doNotGenerateCharge: false,
          terminateContract: false,
          active: true,
        },
      });

      const [discounts, total] = await sut.findAll({ clientId });

      expect(discounts).toHaveLength(1);
      expect(total).toBe(1);
      expect(discounts[0]).toMatchObject({
        id: created.id,
        clientId,
        description: 'Desconto 10%',
        type: DiscountType.PERCENTAGE,
        discountValue: 1000,
        month: 3,
        year: 2026,
        doNotGenerateCharge: false,
        terminateContract: false,
      });
      expect(discounts[0].createdAt).toBeInstanceOf(Date);
      expect(discounts[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should filter by clientId', async() => {
      const [group2, owner2] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo 2 ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner 2 ${Date.now()}`, active: true } }),
      ]);

      const otherClient = await prisma.client.create({
        data: {
          id: 2,
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

      await prisma.clientDiscount.create({
        data: {
          clientId,
          description: 'Desconto cliente 1',
          type: DiscountType.PERCENTAGE,
          discountValue: 500,
          month: 1,
          year: 2026,
          doNotGenerateCharge: false,
          terminateContract: false,
          active: true,
        },
      });

      await prisma.clientDiscount.create({
        data: {
          clientId: otherClient.id,
          description: 'Desconto cliente 2',
          type: DiscountType.PERCENTAGE,
          discountValue: 300,
          month: 1,
          year: 2026,
          doNotGenerateCharge: false,
          terminateContract: false,
          active: true,
        },
      });

      const [discounts, total] = await sut.findAll({ clientId });

      expect(discounts).toHaveLength(1);
      expect(total).toBe(1);
      expect(discounts[0].clientId).toBe(clientId);
      expect(discounts[0].description).toBe('Desconto cliente 1');
    });

    it('should filter by month when provided', async() => {
      await prisma.clientDiscount.createMany({
        data: [
          {
            clientId,
            description: 'Desconto jan',
            type: DiscountType.PERCENTAGE,
            discountValue: 100,
            month: 1,
            year: 2026,
            doNotGenerateCharge: false,
            terminateContract: false,
            active: true,
          },
          {
            clientId,
            description: 'Desconto mar',
            type: DiscountType.PERCENTAGE,
            discountValue: 200,
            month: 3,
            year: 2026,
            doNotGenerateCharge: false,
            terminateContract: false,
            active: true,
          },
          {
            clientId,
            description: 'Desconto mar 2',
            type: DiscountType.PERCENTAGE,
            discountValue: 300,
            month: 3,
            year: 2026,
            doNotGenerateCharge: false,
            terminateContract: false,
            active: true,
          },
        ],
      });

      const [discounts, total] = await sut.findAll({ clientId, month: 3 });

      expect(discounts).toHaveLength(2);
      expect(total).toBe(2);
      expect(discounts.every((d) => d.month === 3)).toBe(true);
    });

    it('should filter by year when provided', async() => {
      await prisma.clientDiscount.createMany({
        data: [
          {
            clientId,
            description: 'Desconto 2025',
            type: DiscountType.PERCENTAGE,
            discountValue: 100,
            month: 1,
            year: 2025,
            doNotGenerateCharge: false,
            terminateContract: false,
            active: true,
          },
          {
            clientId,
            description: 'Desconto 2026',
            type: DiscountType.PERCENTAGE,
            discountValue: 200,
            month: 1,
            year: 2026,
            doNotGenerateCharge: false,
            terminateContract: false,
            active: true,
          },
        ],
      });

      const [discounts, total] = await sut.findAll({ clientId, year: 2025 });

      expect(discounts).toHaveLength(1);
      expect(total).toBe(1);
      expect(discounts[0].year).toBe(2025);
    });

    it('should filter by month and year combined', async() => {
      await prisma.clientDiscount.createMany({
        data: [
          {
            clientId,
            description: 'Mar 2026',
            type: DiscountType.PERCENTAGE,
            discountValue: 100,
            month: 3,
            year: 2026,
            doNotGenerateCharge: false,
            terminateContract: false,
            active: true,
          },
          {
            clientId,
            description: 'Mar 2025',
            type: DiscountType.PERCENTAGE,
            discountValue: 200,
            month: 3,
            year: 2025,
            doNotGenerateCharge: false,
            terminateContract: false,
            active: true,
          },
          {
            clientId,
            description: 'Jan 2026',
            type: DiscountType.PERCENTAGE,
            discountValue: 300,
            month: 1,
            year: 2026,
            doNotGenerateCharge: false,
            terminateContract: false,
            active: true,
          },
        ],
      });

      const [discounts, total] = await sut.findAll({ clientId, month: 3, year: 2026 });

      expect(discounts).toHaveLength(1);
      expect(total).toBe(1);
      expect(discounts[0].month).toBe(3);
      expect(discounts[0].year).toBe(2026);
    });

    it('should search in description (case-insensitive)', async() => {
      await prisma.clientDiscount.create({
        data: {
          clientId,
          description: 'Desconto Especial de Natal',
          type: DiscountType.PERCENTAGE,
          discountValue: 500,
          month: 12,
          year: 2026,
          doNotGenerateCharge: false,
          terminateContract: false,
          active: true,
        },
      });

      await prisma.clientDiscount.create({
        data: {
          clientId,
          description: 'Desconto padrão',
          type: DiscountType.PERCENTAGE,
          discountValue: 100,
          month: 1,
          year: 2026,
          doNotGenerateCharge: false,
          terminateContract: false,
          active: true,
        },
      });

      const [discounts, total] = await sut.findAll({ clientId, search: 'natal' });

      expect(discounts).toHaveLength(1);
      expect(total).toBe(1);
      expect(discounts[0].description).toBe('Desconto Especial de Natal');
    });

    it('should paginate results correctly', async() => {
      await prisma.clientDiscount.createMany({
        data: [1, 2, 3, 4, 5].map((i) => ({
          clientId,
          description: `Desconto ${i}`,
          type: DiscountType.PERCENTAGE,
          discountValue: i * 100,
          month: i,
          year: 2026,
          doNotGenerateCharge: false,
          terminateContract: false,
          active: true,
        })),
      });

      const [page1, total] = await sut.findAll({ clientId, page: 1, size: 2 });
      const [page2] = await sut.findAll({ clientId, page: 2, size: 2 });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(total).toBe(5);
    });

    it('should order by year asc, month asc, id asc', async() => {
      const first = await prisma.clientDiscount.create({
        data: {
          clientId,
          description: 'Primeiro',
          type: DiscountType.PERCENTAGE,
          discountValue: 100,
          month: 1,
          year: 2025,
          doNotGenerateCharge: false,
          terminateContract: false,
          active: true,
        },
      });

      const second = await prisma.clientDiscount.create({
        data: {
          clientId,
          description: 'Segundo',
          type: DiscountType.PERCENTAGE,
          discountValue: 200,
          month: 6,
          year: 2025,
          doNotGenerateCharge: false,
          terminateContract: false,
          active: true,
        },
      });

      const third = await prisma.clientDiscount.create({
        data: {
          clientId,
          description: 'Terceiro',
          type: DiscountType.PERCENTAGE,
          discountValue: 300,
          month: 1,
          year: 2026,
          doNotGenerateCharge: false,
          terminateContract: false,
          active: true,
        },
      });

      const [discounts] = await sut.findAll({ clientId });

      expect(discounts[0].id).toBe(first.id);
      expect(discounts[1].id).toBe(second.id);
      expect(discounts[2].id).toBe(third.id);
    });

    it('should return MONETARY type discount correctly', async() => {
      await prisma.clientDiscount.create({
        data: {
          clientId,
          description: 'Desconto R$ 50',
          type: DiscountType.MONETARY,
          discountValue: 5000,
          month: 6,
          year: 2026,
          doNotGenerateCharge: true,
          terminateContract: true,
          active: true,
        },
      });

      const [discounts] = await sut.findAll({ clientId });

      expect(discounts[0].type).toBe(DiscountType.MONETARY);
      expect(discounts[0].discountValue).toBe(5000);
      expect(discounts[0].doNotGenerateCharge).toBe(true);
      expect(discounts[0].terminateContract).toBe(true);
    });
  });

  describe('findById', () => {
    it('should return null when discount does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should return discount by id with correct DTO format', async() => {
      const created = await prisma.clientDiscount.create({
        data: {
          clientId,
          description: 'Desconto por id',
          type: DiscountType.PERCENTAGE,
          discountValue: 1050,
          month: 3,
          year: 2026,
          doNotGenerateCharge: false,
          terminateContract: false,
          active: true,
        },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result).toMatchObject({
        id: created.id,
        clientId,
        description: 'Desconto por id',
        type: DiscountType.PERCENTAGE,
        discountValue: 1050,
        month: 3,
        year: 2026,
        doNotGenerateCharge: false,
        terminateContract: false,
      });
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });

    it('should return MONETARY type with all fields', async() => {
      const created = await prisma.clientDiscount.create({
        data: {
          clientId,
          description: 'Desconto monetário',
          type: DiscountType.MONETARY,
          discountValue: 25000,
          month: 12,
          year: 2025,
          doNotGenerateCharge: true,
          terminateContract: true,
          active: true,
        },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.type).toBe(DiscountType.MONETARY);
      expect(result?.discountValue).toBe(25000);
      expect(result?.month).toBe(12);
      expect(result?.year).toBe(2025);
      expect(result?.doNotGenerateCharge).toBe(true);
      expect(result?.terminateContract).toBe(true);
    });
  });
});
