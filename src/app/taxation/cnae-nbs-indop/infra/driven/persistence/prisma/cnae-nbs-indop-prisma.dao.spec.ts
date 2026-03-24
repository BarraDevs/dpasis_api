import { Test } from '@nestjs/testing';
import { CnaeNbsIndopDto } from 'src/app/taxation/cnae-nbs-indop/application/dtos/cnae-nbs-indop.dto';
import { CreateCnaeNbsIndopInputDto } from 'src/app/taxation/cnae-nbs-indop/application/usecases/create-cnae-nbs-indop/dtos/create-cnae-nbs-indop.dto';
import { FindAllCnaeNbsIndopQueryDto } from 'src/app/taxation/cnae-nbs-indop/application/usecases/find-all-cnae-nbs-indop/dtos/find-all-cnae-nbs-indop.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CnaeNbsIndopDaoAdapterPrisma } from './cnae-nbs-indop-prisma.dao';

describe('CnaeNbsIndopDaoAdapterPrisma - Integration tests', () => {
  let sut: CnaeNbsIndopDaoAdapterPrisma;
  let prisma: PrismaService;
  let cnaeId: number;
  let nbsId: number;
  let indopId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [CnaeNbsIndopDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(CnaeNbsIndopDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const [cnae, nbs, indop] = await Promise.all([
      prisma.cnae.create({ data: { code: `CNAE${Date.now()}`, description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: `NBS${Date.now()}`, description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: `IND${Date.now()}`, description: 'INDOP Test', active: true } }),
    ]);
    cnaeId = cnae.id;
    nbsId = nbs.id;
    indopId = indop.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  describe('findAll', () => {
    it('should return empty array when no records exist', async() => {
      const query: FindAllCnaeNbsIndopQueryDto = {};

      const [rows, total] = await sut.findAll(query);

      expect(rows).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return records with default pagination', async() => {
      const indop2 = await prisma.indop.create({
        data: { code: `IND2${Date.now()}`, description: 'INDOP 2', active: true },
      });
      await prisma.cnaeNbsIndop.createMany({
        data: [
          { cnaeId, nbsId, indopId },
          { cnaeId, nbsId, indopId: indop2.id },
        ],
      });

      const [rows, total] = await sut.findAll({});

      expect(rows).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should respect pagination with page and size', async() => {
      const [indop2, indop3] = await Promise.all([
        prisma.indop.create({ data: { code: `IND2${Date.now()}`, description: 'INDOP 2', active: true } }),
        prisma.indop.create({ data: { code: `IND3${Date.now()}`, description: 'INDOP 3', active: true } }),
      ]);
      await prisma.cnaeNbsIndop.createMany({
        data: [
          { cnaeId, nbsId, indopId },
          { cnaeId, nbsId, indopId: indop2.id },
          { cnaeId, nbsId, indopId: indop3.id },
        ],
      });

      const [rows, total] = await sut.findAll({ page: 1, size: 2 });

      expect(rows).toHaveLength(2);
      expect(total).toBe(3);
    });

    it('should filter by active when provided', async() => {
      const createdActive = await prisma.cnaeNbsIndop.create({
        data: { cnaeId, nbsId, indopId, active: true },
      });
      const indop2 = await prisma.indop.create({
        data: { code: `IND2${Date.now()}`, description: 'INDOP 2', active: true },
      });
      await prisma.cnaeNbsIndop.create({
        data: { cnaeId, nbsId, indopId: indop2.id, active: false },
      });

      const [rowsActive, totalActive] = await sut.findAll({ active: true });
      const [rowsInactive, totalInactive] = await sut.findAll({ active: false });

      expect(rowsActive).toHaveLength(1);
      expect(totalActive).toBe(1);
      expect(rowsActive[0].id).toBe(createdActive.id);
      expect(rowsActive[0].active).toBe(true);
      expect(rowsInactive).toHaveLength(1);
      expect(totalInactive).toBe(1);
      expect(rowsInactive[0].active).toBe(false);
    });

    it('should filter by cnaeId when provided', async() => {
      const otherCnae = await prisma.cnae.create({
        data: { code: `CNAE2${Date.now()}`, description: 'CNAE 2', active: true },
      });
      await prisma.cnaeNbsIndop.create({ data: { cnaeId, nbsId, indopId } });
      await prisma.cnaeNbsIndop.create({ data: { cnaeId: otherCnae.id, nbsId, indopId } });

      const [rows, total] = await sut.findAll({ cnaeId });

      expect(rows).toHaveLength(1);
      expect(total).toBe(1);
      expect(rows[0].cnae.id).toBe(cnaeId);
    });

    it('should filter by nbsId when provided', async() => {
      const otherNbs = await prisma.nbs.create({
        data: { code: `NBS2${Date.now()}`, description: 'NBS 2', active: true },
      });
      await prisma.cnaeNbsIndop.create({ data: { cnaeId, nbsId, indopId } });
      await prisma.cnaeNbsIndop.create({ data: { cnaeId, nbsId: otherNbs.id, indopId } });

      const [rows, total] = await sut.findAll({ nbsId });

      expect(rows).toHaveLength(1);
      expect(total).toBe(1);
      expect(rows[0].nbs.id).toBe(nbsId);
    });

    it('should return records with correct structure including cnae, nbs, indop', async() => {
      const created = await prisma.cnaeNbsIndop.create({
        data: { cnaeId, nbsId, indopId },
      });

      const [rows] = await sut.findAll({});

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject<Partial<CnaeNbsIndopDto>>({
        id: created.id,
        active: true,
        cnae: { id: cnaeId, code: expect.any(String), description: 'CNAE Test' },
        nbs: { id: nbsId, code: expect.any(String), description: 'NBS Test' },
        indop: { id: indopId, code: expect.any(String), description: 'INDOP Test' },
      });
    });
  });

  describe('findById', () => {
    it('should return null when record does not exist', async() => {
      const result = await sut.findById(99999);

      expect(result).toBeNull();
    });

    it('should return record by id', async() => {
      const created = await prisma.cnaeNbsIndop.create({
        data: { cnaeId, nbsId, indopId },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.cnae.id).toBe(cnaeId);
      expect(result?.nbs.id).toBe(nbsId);
      expect(result?.indop.id).toBe(indopId);
    });
  });

  describe('findByComposite', () => {
    it('should return null when composite does not exist', async() => {
      const result = await sut.findByComposite(99999, 99999, 99999);

      expect(result).toBeNull();
    });

    it('should return record by cnaeId, nbsId, indopId', async() => {
      const created = await prisma.cnaeNbsIndop.create({
        data: { cnaeId, nbsId, indopId },
      });

      const result = await sut.findByComposite(cnaeId, nbsId, indopId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.cnae.id).toBe(cnaeId);
      expect(result?.nbs.id).toBe(nbsId);
      expect(result?.indop.id).toBe(indopId);
    });
  });

  describe('save', () => {
    it('should create record and return id', async() => {
      const data: CreateCnaeNbsIndopInputDto = { cnaeId, nbsId, indopId };

      const id = await sut.save(data);

      const created = await prisma.cnaeNbsIndop.findUnique({ where: { id } });
      expect(created).not.toBeNull();
      expect(created?.cnaeId).toBe(cnaeId);
      expect(created?.nbsId).toBe(nbsId);
      expect(created?.indopId).toBe(indopId);
    });
  });

  describe('delete', () => {
    it('should remove record', async() => {
      const created = await prisma.cnaeNbsIndop.create({
        data: { cnaeId, nbsId, indopId },
      });

      await sut.delete(created.id);

      const found = await prisma.cnaeNbsIndop.findUnique({ where: { id: created.id } });
      expect(found).toBeNull();
    });
  });

  describe('countClientItemsByCnaeNbsIndopId', () => {
    it('should return 0 when no client items use the combination', async() => {
      const created = await prisma.cnaeNbsIndop.create({
        data: { cnaeId, nbsId, indopId },
      });

      const count = await sut.countClientItemsByCnaeNbsIndopId(created.id);

      expect(count).toBe(0);
    });

    it('should return count when client items use the combination', async() => {
      const created = await prisma.cnaeNbsIndop.create({
        data: { cnaeId, nbsId, indopId },
      });

      const [group, owner] = await Promise.all([
        prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
        prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
      ]);

      const client = await prisma.client.create({
        data: {
          type: 'PJ',
          document: '09748165000110',
          ie: null,
          groupId: group.id,
          ownerId: owner.id,
          companyName: 'Empresa Test',
          fantasyName: null,
          headquarters: 'São Paulo',
          invoiceType: 'CONTRACT',
          generateInvoice: false,
          active: true,
        },
      });

      await prisma.clientItem.create({
        data: {
          clientId: client.id,
          description: 'Item Test',
          quantity: 1,
          unitValueInCents: 1000,
          cnaeNbsIndopId: created.id,
          active: true,
        },
      });

      const count = await sut.countClientItemsByCnaeNbsIndopId(created.id);

      expect(count).toBe(1);
    });
  });

  describe('findCnaesForSelect', () => {
    it('should return empty array when no active records exist', async() => {
      const result = await sut.findCnaesForSelect();

      expect(result).toEqual([]);
    });

    it('should return CNAEs that have active CnaeNbsIndop combinations', async() => {
      const [cnae2, indop2] = await Promise.all([
        prisma.cnae.create({ data: { code: `CNAE2${Date.now()}`, description: 'CNAE 2', active: true } }),
        prisma.indop.create({ data: { code: `IND2${Date.now()}`, description: 'INDOP 2', active: true } }),
      ]);
      await prisma.cnaeNbsIndop.createMany({
        data: [
          { cnaeId, nbsId, indopId },
          { cnaeId: cnae2.id, nbsId, indopId: indop2.id },
        ],
      });

      const result = await sut.findCnaesForSelect();

      expect(result).toHaveLength(2);
      expect(result.map((c) => c.id).sort((a, b) => a - b)).toEqual([cnaeId, cnae2.id].sort((a, b) => a - b));
      expect(result[0]).toHaveProperty('code');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('active');
      expect(result[0]).toHaveProperty('createdAt');
      expect(result[0]).toHaveProperty('updatedAt');
    });

    it('should exclude inactive CNAE and inactive CnaeNbsIndop', async() => {
      await prisma.cnaeNbsIndop.create({
        data: { cnaeId, nbsId, indopId, active: false },
      });

      const result = await sut.findCnaesForSelect();

      expect(result).toEqual([]);
    });
  });

  describe('findNbssForSelectByCnaeId', () => {
    it('should return empty array when no records for cnaeId', async() => {
      const result = await sut.findNbssForSelectByCnaeId(cnaeId);

      expect(result).toEqual([]);
    });

    it('should return NBSs that have active combinations with the given CNAE', async() => {
      const [nbs2, indop2] = await Promise.all([
        prisma.nbs.create({ data: { code: `NBS2${Date.now()}`, description: 'NBS 2', active: true } }),
        prisma.indop.create({ data: { code: `IND2${Date.now()}`, description: 'INDOP 2', active: true } }),
      ]);
      await prisma.cnaeNbsIndop.createMany({
        data: [
          { cnaeId, nbsId, indopId },
          { cnaeId, nbsId: nbs2.id, indopId: indop2.id },
        ],
      });

      const result = await sut.findNbssForSelectByCnaeId(cnaeId);

      expect(result).toHaveLength(2);
      expect(result.map((n) => n.id).sort((a, b) => a - b)).toEqual([nbsId, nbs2.id].sort((a, b) => a - b));
    });

    it('should exclude inactive NBS', async() => {
      const inactiveNbs = await prisma.nbs.create({
        data: { code: `NBS0${Date.now() % 100000}`, description: 'Inactive', active: false },
      });
      await prisma.cnaeNbsIndop.create({
        data: { cnaeId, nbsId: inactiveNbs.id, indopId },
      });

      const result = await sut.findNbssForSelectByCnaeId(cnaeId);

      expect(result).toEqual([]);
    });
  });

  describe('findIndopsForSelectByCnaeAndNbs', () => {
    it('should return empty array when no records exist', async() => {
      const result = await sut.findIndopsForSelectByCnaeAndNbs(cnaeId, nbsId);

      expect(result).toEqual([]);
    });

    it('should return INDOPs that have active combinations with the given CNAE and NBS', async() => {
      const indop2 = await prisma.indop.create({
        data: { code: `IND2${Date.now()}`, description: 'INDOP 2', active: true },
      });
      await prisma.cnaeNbsIndop.createMany({
        data: [
          { cnaeId, nbsId, indopId },
          { cnaeId, nbsId, indopId: indop2.id },
        ],
      });

      const result = await sut.findIndopsForSelectByCnaeAndNbs(cnaeId, nbsId);

      expect(result).toHaveLength(2);
      expect(result.map((i) => i.id).sort((a, b) => a - b)).toEqual([indopId, indop2.id].sort((a, b) => a - b));
    });

    it('should exclude inactive INDOP', async() => {
      const inactiveIndop = await prisma.indop.create({
        data: { code: `IND0${Date.now() % 100000}`, description: 'Inactive', active: false },
      });
      await prisma.cnaeNbsIndop.create({
        data: { cnaeId, nbsId, indopId: inactiveIndop.id },
      });

      const result = await sut.findIndopsForSelectByCnaeAndNbs(cnaeId, nbsId);

      expect(result).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('should update active to false', async() => {
      const created = await prisma.cnaeNbsIndop.create({
        data: { cnaeId, nbsId, indopId, active: true },
      });

      await sut.updateStatus(created.id, false);

      const updated = await prisma.cnaeNbsIndop.findUnique({ where: { id: created.id } });
      expect(updated?.active).toBe(false);
    });

    it('should update active to true', async() => {
      const created = await prisma.cnaeNbsIndop.create({
        data: { cnaeId, nbsId, indopId, active: false },
      });

      await sut.updateStatus(created.id, true);

      const updated = await prisma.cnaeNbsIndop.findUnique({ where: { id: created.id } });
      expect(updated?.active).toBe(true);
    });
  });
});
