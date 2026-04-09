import { Test } from '@nestjs/testing';
import { IndopDto } from 'src/app/global/taxation/indop/application/dtos/indop.dto';
import { CreateIndopInputDto } from 'src/app/global/taxation/indop/application/usecases/create-indop/dtos/create-indop.dto';
import { EditIndopInputDto } from 'src/app/global/taxation/indop/application/usecases/edit-indop/dtos/edit-indop.dto';
import { FindAllIndopQueryDto } from 'src/app/global/taxation/indop/application/usecases/find-all-indop/dtos/find-all-indop.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IndopDaoAdapterPrisma } from './indop-prisma.dao';

describe('IndopDaoAdapterPrisma - Integration tests', () => {
  let sut: IndopDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [IndopDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(IndopDaoAdapterPrisma);
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
    it('should return empty array when no indops exist', async() => {
      // Arrange
      const query: FindAllIndopQueryDto = {};

      // Act
      const [indops, total] = await sut.findAll(query);

      // Assert
      expect(indops).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all indops with default pagination', async() => {
      // Arrange
      await prisma.indop.createMany({
        data: [
          { code: '1012-1/01', description: 'Desc 1', active: true },
          { code: '1012-1/02', description: 'Desc 2', active: false },
        ],
      });
      const query: FindAllIndopQueryDto = {};

      // Act
      const [indops, total] = await sut.findAll(query);

      // Assert
      expect(indops).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      // Arrange
      await prisma.indop.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          code: `1012-1/${String(i + 1).padStart(2, '0')}`,
          description: `Desc ${i + 1}`,
          active: true,
        })),
      });

      // Act
      const [indops, total] = await sut.findAll({ page: 1, size: 10 });
      const [indops2, total2] = await sut.findAll({ page: 3, size: 10 });

      // Assert
      expect(indops).toHaveLength(10);
      expect(total).toBe(25);
      expect(indops2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should filter by active when provided', async() => {
      await prisma.indop.createMany({
        data: [
          { code: '1012-1/01', description: 'Desc 1', active: true },
          { code: '1012-1/02', description: 'Desc 2', active: false },
        ],
      });

      const [activeIndops, activeTotal] = await sut.findAll({ active: true });
      const [inactiveIndops, inactiveTotal] = await sut.findAll({ active: false });

      expect(activeIndops).toHaveLength(1);
      expect(activeTotal).toBe(1);
      expect(activeIndops[0].active).toBe(true);
      expect(inactiveIndops).toHaveLength(1);
      expect(inactiveTotal).toBe(1);
      expect(inactiveIndops[0].active).toBe(false);
    });

    it('should search in code and description (case-insensitive)', async() => {
      // Arrange
      await prisma.indop.createMany({
        data: [
          { code: '1012-1/01', description: 'Fabricação de alimentos', active: true },
          { code: '1012-1/02', description: 'Comércio', active: true },
        ],
      });
      const query: FindAllIndopQueryDto = { search: 'fabricação' };

      // Act
      const [indops, total] = await sut.findAll(query);

      // Assert
      expect(indops).toHaveLength(1);
      expect(total).toBe(1);
      expect(indops[0].description).toBe('Fabricação de alimentos');
    });

    it('should return results ordered by code asc', async() => {
      // Arrange
      const i1 = await prisma.indop.create({
        data: { code: 'A', description: 'A', active: true },
      });
      const i2 = await prisma.indop.create({
        data: { code: 'B', description: 'B', active: true },
      });
      const query: FindAllIndopQueryDto = {};

      // Act
      const [indops] = await sut.findAll(query);

      // Assert
      expect(indops).toHaveLength(2);
      expect(indops[0].code).toBe(i1.code);
      expect(indops[1].code).toBe(i2.code);
    });

    it('should return all indop fields correctly', async() => {
      // Arrange
      const created = await prisma.indop.create({
        data: { code: '1012-1/01', description: 'Test', active: true },
      });
      const query: FindAllIndopQueryDto = {};

      // Act
      const [indops] = await sut.findAll(query);

      // Assert
      expect(indops).toHaveLength(1);
      expect(indops[0]).toEqual<IndopDto>({
        id: created.id,
        code: created.code,
        description: created.description,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    });
  });

  describe('findById', () => {
    it('should return null when indop does not exist', async() => {
      // Arrange
      const id = 0;

      // Act
      const result = await sut.findById(id);

      // Assert
      expect(result).toBeNull();
    });

    it('should return indop by id', async() => {
      // Arrange
      const created = await prisma.indop.create({
        data: { code: '1012-1/01', description: 'Test', active: true },
      });

      // Act
      const result = await sut.findById(created.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.code).toBe('1012-1/01');
      expect(result?.description).toBe('Test');
      expect(result?.active).toBe(true);
    });
  });

  describe('findByCode', () => {
    it('should return null when indop does not exist', async() => {
      // Arrange
      await prisma.indop.create({
        data: { code: '1012-1/01', description: 'Test', active: true },
      });

      // Act
      const result = await sut.findByCode('1012-1/02');

      // Assert
      expect(result).toBeNull();
    });

    it('should return indop by code', async() => {
      // Arrange
      const created = await prisma.indop.create({
        data: { code: '1012-1/01', description: 'Test', active: true },
      });

      // Act
      const result = await sut.findByCode(created.code);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.code).toBe(created.code);
      expect(result?.active).toBe(created.active);
    });

    it('should find indop by code (case-insensitive)', async() => {
      // Arrange
      const created = await prisma.indop.create({
        data: { code: '1012-1/01', description: 'Test', active: true },
      });

      // Act
      const result = await sut.findByCode('1012-1/01');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.code).toBe(created.code);
    });
  });

  describe('save', () => {
    it('should create indop and return id', async() => {
      // Arrange
      const data: CreateIndopInputDto = {
        code: '1012-1/01',
        description: 'Fabricação de produtos alimentícios',
      };

      // Act
      const id = await sut.save(data);

      // Assert
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.indop.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.code).toBe(data.code);
      expect(saved?.description).toBe(data.description);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update indop code and description', async() => {
      // Arrange
      const indop = await prisma.indop.create({
        data: { code: '1012-1/01', description: 'Desc original', active: true },
      });
      const data: EditIndopInputDto = {
        code: '1012-1/02',
        description: 'Desc atualizada',
      };

      // Act
      await sut.edit(indop.id, data);

      // Assert
      const updated = await prisma.indop.findUnique({ where: { id: indop.id } });
      expect(updated?.code).toBe('1012-1/02');
      expect(updated?.description).toBe('Desc atualizada');
      expect(updated?.active).toBe(true);
    });
  });

  describe('updateStatus', () => {
    it('should update indop status', async() => {
      // Arrange
      const indop = await prisma.indop.create({
        data: { code: '1012-1/01', description: 'Test', active: true },
      });

      // Act
      await sut.updateStatus(indop.id, false);

      // Assert
      const updated = await prisma.indop.findUnique({ where: { id: indop.id } });
      expect(updated?.active).toBe(false);

      // Act (again)
      await sut.updateStatus(indop.id, true);

      // Assert (again)
      const updated2 = await prisma.indop.findUnique({ where: { id: indop.id } });
      expect(updated2?.active).toBe(true);
    });
  });

  describe('delete', () => {
    it('should remove indop', async() => {
      const indop = await prisma.indop.create({
        data: { code: `D${Date.now()}`, description: 'Test', active: true },
      });

      await sut.delete(indop.id);

      expect(await prisma.indop.findUnique({ where: { id: indop.id } })).toBeNull();
    });
  });

  describe('countCnaeNbsIndopByIndopId', () => {
    it('should return 0 when there is no combination for this INDOP', async() => {
      const indop = await prisma.indop.create({
        data: { code: `D${Date.now()}`, description: 'Test', active: true },
      });

      const count = await sut.countCnaeNbsIndopByIndopId(indop.id);

      expect(count).toBe(0);
    });

    it('should return count of combinations referencing this INDOP', async() => {
      const suffix = `${Date.now()}`;
      const [cnae, nbs, indop] = await Promise.all([
        prisma.cnae.create({ data: { code: `C${suffix}`, description: 'C', active: true } }),
        prisma.nbs.create({ data: { code: `N${suffix}`, description: 'N', active: true } }),
        prisma.indop.create({ data: { code: `D${suffix}`, description: 'I', active: true } }),
      ]);
      await prisma.cnaeNbsIndop.create({
        data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
      });

      const count = await sut.countCnaeNbsIndopByIndopId(indop.id);

      expect(count).toBe(1);
    });
  });
});
