import { Test } from '@nestjs/testing';
import { ProposalValidityDto } from 'src/app/service/proposal-validity/application/dtos/proposal-validity.dto';
import { CreateProposalValidityInputDto } from 'src/app/service/proposal-validity/application/usecases/create-proposal-validity/dtos/create-proposal-validity.dto';
import { EditProposalValidityInputDto } from 'src/app/service/proposal-validity/application/usecases/edit-proposal-validity/dtos/edit-proposal-validity.dto';
import { FindAllProposalValidityQueryDto } from 'src/app/service/proposal-validity/application/usecases/find-all-proposal-validity/dtos/find-all-proposal-validity.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProposalValidityDaoAdapterPrisma } from './proposal-validity-prisma.dao';

describe('ProposalValidityDaoAdapterPrisma - Integration tests', () => {
  let sut: ProposalValidityDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ProposalValidityDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ProposalValidityDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  describe('findAll', () => {
    it('should return empty array when no validity records exist', async() => {
      const query: FindAllProposalValidityQueryDto = {};

      const [rows, total] = await sut.findAll(query);

      expect(rows).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all validities with default pagination', async() => {
      await prisma.proposalValidity.createMany({
        data: [
          { name: `Validity ${Date.now()}-1`, active: true },
          { name: `Validity ${Date.now()}-2`, active: false },
        ],
      });

      const query: FindAllProposalValidityQueryDto = {};
      const [rows, total] = await sut.findAll(query);

      expect(rows).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      await prisma.proposalValidity.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          name: `Validity ${Date.now()}-${i + 1}`,
          active: true,
        })),
      });

      const [rows, total] = await sut.findAll({ page: 1, size: 10 });
      const [rows2, total2] = await sut.findAll({ page: 3, size: 10 });

      expect(rows).toHaveLength(10);
      expect(total).toBe(25);
      expect(rows2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should filter by active when provided', async() => {
      await prisma.proposalValidity.createMany({
        data: [
          { name: `Validity Ativo ${Date.now()}`, active: true },
          { name: `Validity Inativo ${Date.now()}`, active: false },
        ],
      });

      const [activeTypes, activeTotal] = await sut.findAll({ active: true });
      const [inactiveTypes, inactiveTotal] = await sut.findAll({ active: false });

      expect(activeTypes).toHaveLength(1);
      expect(activeTotal).toBe(1);
      expect(activeTypes[0].active).toBe(true);

      expect(inactiveTypes).toHaveLength(1);
      expect(inactiveTotal).toBe(1);
      expect(inactiveTypes[0].active).toBe(false);
    });

    it('should search in name field (case-insensitive)', async() => {
      const suffix = Date.now();
      await prisma.proposalValidity.createMany({
        data: [
          { name: `30 dias busca-alfa-${suffix}`, active: true },
          { name: `90 dias busca-beta-${suffix}`, active: true },
        ],
      });

      const query: FindAllProposalValidityQueryDto = { search: 'busca-alfa' };
      const [rows, total] = await sut.findAll(query);

      expect(rows).toHaveLength(1);
      expect(total).toBe(1);
      expect(rows[0].name).toContain('30 dias');
    });

    it('should return results ordered by name asc', async() => {
      const ct1 = await prisma.proposalValidity.create({ data: { name: `B-${Date.now()}`, active: true } });
      const ct2 = await prisma.proposalValidity.create({ data: { name: `A-${Date.now()}`, active: true } });

      const [rows] = await sut.findAll({});

      expect(rows).toHaveLength(2);
      expect(rows[0].name).toBe(ct2.name);
      expect(rows[1].name).toBe(ct1.name);
    });

    it('should return all validity fields correctly', async() => {
      const created = await prisma.proposalValidity.create({
        data: { name: `Validity Test ${Date.now()}`, active: true },
      });

      const [rows] = await sut.findAll({});

      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual<ProposalValidityDto>({
        id: created.id,
        name: created.name,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should return null when validity does not exist', async() => {
      const result = await sut.findById(0);

      expect(result).toBeNull();
    });

    it('should return validity by id', async() => {
      const created = await prisma.proposalValidity.create({
        data: { name: `Validity Test ${Date.now()}`, active: true },
      });

      const result = await sut.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.name).toBe(created.name);
      expect(result?.active).toBe(true);
    });
  });

  describe('findByName', () => {
    it('should return null when validity does not exist', async() => {
      await prisma.proposalValidity.create({ data: { name: `Validity ${Date.now()}`, active: true } });

      const result = await sut.findByName('Validity Inexistente');

      expect(result).toBeNull();
    });

    it('should return validity by name (case-insensitive)', async() => {
      const name = `Validity ${Date.now()}`;
      const created = await prisma.proposalValidity.create({ data: { name, active: true } });

      const result = await sut.findByName(name.toLowerCase());

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
    });
  });

  describe('save', () => {
    it('should create validity and return id', async() => {
      const data: CreateProposalValidityInputDto = { name: `30 dias ${Date.now()}` };

      const id = await sut.save(data);
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.proposalValidity.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe(data.name);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update validity name', async() => {
      const validityRow = await prisma.proposalValidity.create({
        data: { name: `Nome original ${Date.now()}`, active: true },
      });

      const data: EditProposalValidityInputDto = { name: `Nome atualizado ${Date.now()}` };
      await sut.edit(validityRow.id, data);

      const updated = await prisma.proposalValidity.findUnique({ where: { id: validityRow.id } });
      expect(updated?.name).toBe(data.name);
      expect(updated?.active).toBe(true);
    });
  });

  describe('countServicesByProposalValidityId', () => {
    it('should return 0 when no services use the proposal validity', async() => {
      const validityRow = await prisma.proposalValidity.create({
        data: { name: `Validity ${Date.now()}`, active: true },
      });

      const count = await sut.countServicesByProposalValidityId(validityRow.id);

      expect(count).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete validity from database', async() => {
      const validityRow = await prisma.proposalValidity.create({
        data: { name: `Validity ${Date.now()}`, active: true },
      });

      await sut.delete(validityRow.id);

      const deleted = await prisma.proposalValidity.findUnique({ where: { id: validityRow.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update validity status', async() => {
      const validityRow = await prisma.proposalValidity.create({
        data: { name: `Validity ${Date.now()}`, active: true },
      });

      await sut.updateStatus(validityRow.id, false);
      const updated = await prisma.proposalValidity.findUnique({ where: { id: validityRow.id } });
      expect(updated?.active).toBe(false);

      await sut.updateStatus(validityRow.id, true);
      const updated2 = await prisma.proposalValidity.findUnique({ where: { id: validityRow.id } });
      expect(updated2?.active).toBe(true);
    });
  });
});
