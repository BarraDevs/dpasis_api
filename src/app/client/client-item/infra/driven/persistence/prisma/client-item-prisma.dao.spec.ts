import { Test } from '@nestjs/testing';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientItemDaoAdapterPrisma } from './client-item-prisma.dao';

const makeCnaeNbsIndop = (id: number, code: string) => ({
  id,
  cnae: { id: 1, code, description: 'Desc' },
  nbs: { id: 1, code: '12345678', description: 'Desc' },
  indop: { id: 1, code: '1', description: 'Desc' },
});

describe('ClientItemDaoAdapterPrisma - Integration tests', () => {
  let sut: ClientItemDaoAdapterPrisma;
  let prisma: PrismaService;
  let clientId: number;
  let cnaeNbsIndopId: number;

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

    const [group, owner, cnae, nbs, indop] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
      prisma.cnae.create({ data: { code: '1234567', description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: '12345678', description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: '1', description: 'INDOP Test', active: true } }),
    ]);

    const cni = await prisma.cnaeNbsIndop.create({
      data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
    });
    cnaeNbsIndopId = cni.id;

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
            cnaeNbsIndopId,
            active: true,
          },
          {
            clientId,
            description: 'Item 2',
            quantity: 2,
            unitValueInCents: 5000,
            cnaeNbsIndopId,
            active: true,
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
            cnaeNbsIndopId,
            active: true,
          },
          {
            clientId,
            description: 'Item 2',
            quantity: 1,
            unitValueInCents: 5000,
            cnaeNbsIndopId,
            active: true,
          },
          {
            clientId,
            description: 'Item 3',
            quantity: 1,
            unitValueInCents: 7500,
            cnaeNbsIndopId,
            active: true,
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
          cnaeNbsIndopId,
          active: true,
        },
      });
      await prisma.clientItem.create({
        data: {
          clientId,
          description: 'Produto XYZ',
          quantity: 1,
          unitValueInCents: 5000,
          cnaeNbsIndopId,
          active: true,
        },
      });

      const [items, total] = await sut.findAll({ clientId, search: 'CONSULTORIA' });

      expect(items).toHaveLength(1);
      expect(total).toBe(1);
      expect(items[0].description).toBe('Serviço de consultoria');
    });

    it('should search in cnae (case-insensitive)', async() => {
      const [cnae1, cnae2, nbs, indop] = await Promise.all([
        prisma.cnae.create({ data: { code: '6201501', description: 'CNAE A', active: true } }),
        prisma.cnae.create({ data: { code: '4712100', description: 'CNAE B', active: true } }),
        prisma.nbs.create({ data: { code: 'NBS-DAO-1', description: 'NBS', active: true } }),
        prisma.indop.create({ data: { code: 'INDOP-DAO-1', description: 'INDOP', active: true } }),
      ]);
      const [cni1, cni2] = await Promise.all([
        prisma.cnaeNbsIndop.create({ data: { cnaeId: cnae1.id, nbsId: nbs.id, indopId: indop.id } }),
        prisma.cnaeNbsIndop.create({ data: { cnaeId: cnae2.id, nbsId: nbs.id, indopId: indop.id } }),
      ]);

      await prisma.clientItem.createMany({
        data: [
          { clientId, description: 'Item A', quantity: 1, unitValueInCents: 10000, cnaeNbsIndopId: cni1.id, active: true },
          { clientId, description: 'Item B', quantity: 1, unitValueInCents: 5000, cnaeNbsIndopId: cni2.id, active: true },
        ],
      });

      const [items] = await sut.findAll({ clientId, search: '6201501' });

      expect(items).toHaveLength(1);
      expect(items[0].cnaeNbsIndop.cnae.code).toBe('6201501');
    });

    it('should search in nbs (case-insensitive)', async() => {
      const [cnae, nbs1, nbs2, indop] = await Promise.all([
        prisma.cnae.create({ data: { code: 'CNAE-DAO-1', description: 'CNAE', active: true } }),
        prisma.nbs.create({ data: { code: '01010101', description: 'NBS A', active: true } }),
        prisma.nbs.create({ data: { code: '99999999', description: 'NBS B', active: true } }),
        prisma.indop.create({ data: { code: 'INDOP-DAO-2', description: 'INDOP', active: true } }),
      ]);
      const [cni1, cni2] = await Promise.all([
        prisma.cnaeNbsIndop.create({ data: { cnaeId: cnae.id, nbsId: nbs1.id, indopId: indop.id } }),
        prisma.cnaeNbsIndop.create({ data: { cnaeId: cnae.id, nbsId: nbs2.id, indopId: indop.id } }),
      ]);

      await prisma.clientItem.createMany({
        data: [
          { clientId, description: 'Item A', quantity: 1, unitValueInCents: 10000, cnaeNbsIndopId: cni1.id, active: true },
          { clientId, description: 'Item B', quantity: 1, unitValueInCents: 5000, cnaeNbsIndopId: cni2.id, active: true },
        ],
      });

      const [items] = await sut.findAll({ clientId, search: '01010101' });

      expect(items).toHaveLength(1);
      expect(items[0].cnaeNbsIndop.nbs.code).toBe('01010101');
    });

    it('should search in indop (case-insensitive)', async() => {
      const [cnae, nbs, indop1, indop2] = await Promise.all([
        prisma.cnae.create({ data: { code: 'CNAE-DAO-2', description: 'CNAE', active: true } }),
        prisma.nbs.create({ data: { code: 'NBS-DAO-2', description: 'NBS', active: true } }),
        prisma.indop.create({ data: { code: 'INDOP-X', description: 'INDOP A', active: true } }),
        prisma.indop.create({ data: { code: 'INDOP-Y', description: 'INDOP B', active: true } }),
      ]);
      const [cni1, cni2] = await Promise.all([
        prisma.cnaeNbsIndop.create({ data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop1.id } }),
        prisma.cnaeNbsIndop.create({ data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop2.id } }),
      ]);

      await prisma.clientItem.createMany({
        data: [
          { clientId, description: 'Item A', quantity: 1, unitValueInCents: 10000, cnaeNbsIndopId: cni1.id, active: true },
          { clientId, description: 'Item B', quantity: 1, unitValueInCents: 5000, cnaeNbsIndopId: cni2.id, active: true },
        ],
      });

      const [items] = await sut.findAll({ clientId, search: 'indop-x' });

      expect(items).toHaveLength(1);
      expect(items[0].cnaeNbsIndop.indop.code).toBe('INDOP-X');
    });

    it('should filter by cnaeId', async() => {
      const [cnae1, cnae2, nbs, indop] = await Promise.all([
        prisma.cnae.create({ data: { code: 'FILTRO-CNAE-1', description: 'CNAE Filtro 1', active: true } }),
        prisma.cnae.create({ data: { code: 'FILTRO-CNAE-2', description: 'CNAE Filtro 2', active: true } }),
        prisma.nbs.create({ data: { code: 'NBS-FILTRO-1', description: 'NBS', active: true } }),
        prisma.indop.create({ data: { code: 'INDOP-FILTRO-1', description: 'INDOP', active: true } }),
      ]);
      const [cni1, cni2] = await Promise.all([
        prisma.cnaeNbsIndop.create({ data: { cnaeId: cnae1.id, nbsId: nbs.id, indopId: indop.id } }),
        prisma.cnaeNbsIndop.create({ data: { cnaeId: cnae2.id, nbsId: nbs.id, indopId: indop.id } }),
      ]);

      await prisma.clientItem.createMany({
        data: [
          { clientId, description: 'Item CNAE 1', quantity: 1, unitValueInCents: 10000, cnaeNbsIndopId: cni1.id, active: true },
          { clientId, description: 'Item CNAE 2', quantity: 1, unitValueInCents: 5000, cnaeNbsIndopId: cni2.id, active: true },
        ],
      });

      const [items] = await sut.findAll({ clientId, cnaeId: cnae1.id });

      expect(items).toHaveLength(1);
      expect(items[0].description).toBe('Item CNAE 1');
      expect(items[0].cnaeNbsIndop.cnae.id).toBe(cnae1.id);
    });

    it('should filter by nbsId', async() => {
      const [cnae, nbs1, nbs2, indop] = await Promise.all([
        prisma.cnae.create({ data: { code: 'CNAE-FILTRO-NBS', description: 'CNAE', active: true } }),
        prisma.nbs.create({ data: { code: 'NBS-FILTRO-1', description: 'NBS Filtro 1', active: true } }),
        prisma.nbs.create({ data: { code: 'NBS-FILTRO-2', description: 'NBS Filtro 2', active: true } }),
        prisma.indop.create({ data: { code: 'INDOP-FILTRO-NBS', description: 'INDOP', active: true } }),
      ]);
      const [cni1, cni2] = await Promise.all([
        prisma.cnaeNbsIndop.create({ data: { cnaeId: cnae.id, nbsId: nbs1.id, indopId: indop.id } }),
        prisma.cnaeNbsIndop.create({ data: { cnaeId: cnae.id, nbsId: nbs2.id, indopId: indop.id } }),
      ]);

      await prisma.clientItem.createMany({
        data: [
          { clientId, description: 'Item NBS 1', quantity: 1, unitValueInCents: 10000, cnaeNbsIndopId: cni1.id, active: true },
          { clientId, description: 'Item NBS 2', quantity: 1, unitValueInCents: 5000, cnaeNbsIndopId: cni2.id, active: true },
        ],
      });

      const [items] = await sut.findAll({ clientId, nbsId: nbs1.id });

      expect(items).toHaveLength(1);
      expect(items[0].description).toBe('Item NBS 1');
      expect(items[0].cnaeNbsIndop.nbs.id).toBe(nbs1.id);
    });

    it('should filter by indopId', async() => {
      const [cnae, nbs, indop1, indop2] = await Promise.all([
        prisma.cnae.create({ data: { code: 'CNAE-FILTRO-INDOP', description: 'CNAE', active: true } }),
        prisma.nbs.create({ data: { code: 'NBS-FILTRO-INDOP', description: 'NBS', active: true } }),
        prisma.indop.create({ data: { code: 'INDOP-FILTRO-1', description: 'INDOP Filtro 1', active: true } }),
        prisma.indop.create({ data: { code: 'INDOP-FILTRO-2', description: 'INDOP Filtro 2', active: true } }),
      ]);
      const [cni1, cni2] = await Promise.all([
        prisma.cnaeNbsIndop.create({ data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop1.id } }),
        prisma.cnaeNbsIndop.create({ data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop2.id } }),
      ]);

      await prisma.clientItem.createMany({
        data: [
          { clientId, description: 'Item INDOP 1', quantity: 1, unitValueInCents: 10000, cnaeNbsIndopId: cni1.id, active: true },
          { clientId, description: 'Item INDOP 2', quantity: 1, unitValueInCents: 5000, cnaeNbsIndopId: cni2.id, active: true },
        ],
      });

      const [items] = await sut.findAll({ clientId, indopId: indop1.id });

      expect(items).toHaveLength(1);
      expect(items[0].description).toBe('Item INDOP 1');
      expect(items[0].cnaeNbsIndop.indop.id).toBe(indop1.id);
    });

    it('should filter by cnaeId, nbsId and indopId combined', async() => {
      const [cnae1, cnae2, nbs1, nbs2, indop1, indop2] = await Promise.all([
        prisma.cnae.create({ data: { code: 'CNAE-COMBO-1', description: 'CNAE', active: true } }),
        prisma.cnae.create({ data: { code: 'CNAE-COMBO-2', description: 'CNAE', active: true } }),
        prisma.nbs.create({ data: { code: 'NBS-COMBO-1', description: 'NBS', active: true } }),
        prisma.nbs.create({ data: { code: 'NBS-COMBO-2', description: 'NBS', active: true } }),
        prisma.indop.create({ data: { code: 'INDOP-COMBO-1', description: 'INDOP', active: true } }),
        prisma.indop.create({ data: { code: 'INDOP-COMBO-2', description: 'INDOP', active: true } }),
      ]);
      const cni1 = await prisma.cnaeNbsIndop.create({
        data: { cnaeId: cnae1.id, nbsId: nbs1.id, indopId: indop1.id },
      });
      const cni2 = await prisma.cnaeNbsIndop.create({
        data: { cnaeId: cnae2.id, nbsId: nbs2.id, indopId: indop2.id },
      });

      await prisma.clientItem.createMany({
        data: [
          { clientId, description: 'Item Combo 1', quantity: 1, unitValueInCents: 10000, cnaeNbsIndopId: cni1.id, active: true },
          { clientId, description: 'Item Combo 2', quantity: 1, unitValueInCents: 5000, cnaeNbsIndopId: cni2.id, active: true },
        ],
      });

      const [items] = await sut.findAll({
        clientId,
        cnaeId: cnae1.id,
        nbsId: nbs1.id,
        indopId: indop1.id,
      });

      expect(items).toHaveLength(1);
      expect(items[0].description).toBe('Item Combo 1');
      expect(items[0].cnaeNbsIndop.cnae.id).toBe(cnae1.id);
      expect(items[0].cnaeNbsIndop.nbs.id).toBe(nbs1.id);
      expect(items[0].cnaeNbsIndop.indop.id).toBe(indop1.id);
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
          cnaeNbsIndopId,
          active: true,
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
          cnaeNbsIndopId,
          active: true,
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
          cnaeNbsIndopId,
          active: true,
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
      });
      expect(result?.cnaeNbsIndop).toBeDefined();
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
      cnaeNbsIndop: makeCnaeNbsIndop(1, '1234567'),
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
