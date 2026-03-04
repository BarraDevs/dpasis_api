import { Test } from '@nestjs/testing';
import { NbsDto } from 'src/app/nbs/nbs/application/dtos/nbs.dto';
import { CreateNbsInputDto } from 'src/app/nbs/nbs/application/usecases/create-nbs/dtos/create-nbs.dto';
import { EditNbsInputDto } from 'src/app/nbs/nbs/application/usecases/edit-nbs/dtos/edit-nbs.dto';
import { FindAllNbsQueryDto } from 'src/app/nbs/nbs/application/usecases/find-all-nbs/dtos/find-all-nbs.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NbsDaoAdapterPrisma } from './nbs-prisma.dao';

describe('NbsDaoAdapterPrisma - Integration tests', () => {
  let sut: NbsDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [NbsDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(NbsDaoAdapterPrisma);
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
    it('should return empty array when no nbss exist', async() => {
      // Arrange
      const query: FindAllNbsQueryDto = {};

      // Act
      const [nbss, total] = await sut.findAll(query);

      // Assert
      expect(nbss).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all nbss with default pagination', async() => {
      // Arrange
      await prisma.nbs.createMany({
        data: [
          { code: '1012-1/01', description: 'Desc 1', active: true },
          { code: '1012-1/02', description: 'Desc 2', active: false },
        ],
      });
      const query: FindAllNbsQueryDto = {};

      // Act
      const [nbss, total] = await sut.findAll(query);

      // Assert
      expect(nbss).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      // Arrange
      await prisma.nbs.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          code: `1012-1/${String(i + 1).padStart(2, '0')}`,
          description: `Desc ${i + 1}`,
          active: true,
        })),
      });

      // Act
      const [nbss, total] = await sut.findAll({ page: 1, size: 10 });
      const [nbss2, total2] = await sut.findAll({ page: 3, size: 10 });

      // Assert
      expect(nbss).toHaveLength(10);
      expect(total).toBe(25);
      expect(nbss2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should search in code and description (case-insensitive)', async() => {
      // Arrange
      await prisma.nbs.createMany({
        data: [
          { code: '1012-1/01', description: 'Fabricação de alimentos', active: true },
          { code: '1012-1/02', description: 'Comércio', active: true },
        ],
      });
      const query: FindAllNbsQueryDto = { search: 'fabricação' };

      // Act
      const [nbss, total] = await sut.findAll(query);

      // Assert
      expect(nbss).toHaveLength(1);
      expect(total).toBe(1);
      expect(nbss[0].description).toBe('Fabricação de alimentos');
    });

    it('should return results ordered by code asc', async() => {
      // Arrange
      const n1 = await prisma.nbs.create({
        data: { code: 'A', description: 'A', active: true },
      });
      const n2 = await prisma.nbs.create({
        data: { code: 'B', description: 'B', active: true },
      });
      const query: FindAllNbsQueryDto = {};

      // Act
      const [nbss] = await sut.findAll(query);

      // Assert
      expect(nbss).toHaveLength(2);
      expect(nbss[0].code).toBe(n1.code);
      expect(nbss[1].code).toBe(n2.code);
    });

    it('should return all nbs fields correctly', async() => {
      // Arrange
      const created = await prisma.nbs.create({
        data: { code: '1012-1/01', description: 'Test', active: true },
      });
      const query: FindAllNbsQueryDto = {};

      // Act
      const [nbss] = await sut.findAll(query);

      // Assert
      expect(nbss).toHaveLength(1);
      expect(nbss[0]).toEqual<NbsDto>({
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
    it('should return null when nbs does not exist', async() => {
      // Arrange
      const id = 0;

      // Act
      const result = await sut.findById(id);

      // Assert
      expect(result).toBeNull();
    });

    it('should return nbs by id', async() => {
      // Arrange
      const created = await prisma.nbs.create({
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
    it('should return null when nbs does not exist', async() => {
      // Arrange
      await prisma.nbs.create({
        data: { code: '1012-1/01', description: 'Test', active: true },
      });

      // Act
      const result = await sut.findByCode('1012-1/02');

      // Assert
      expect(result).toBeNull();
    });

    it('should return nbs by code', async() => {
      // Arrange
      const created = await prisma.nbs.create({
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

    it('should find nbs by code (case-insensitive)', async() => {
      // Arrange
      const created = await prisma.nbs.create({
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
    it('should create nbs and return id', async() => {
      // Arrange
      const data: CreateNbsInputDto = {
        code: '1012-1/01',
        description: 'Fabricação de produtos alimentícios',
      };

      // Act
      const id = await sut.save(data);

      // Assert
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.nbs.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.code).toBe(data.code);
      expect(saved?.description).toBe(data.description);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update nbs code and description', async() => {
      // Arrange
      const nbs = await prisma.nbs.create({
        data: { code: '1012-1/01', description: 'Desc original', active: true },
      });
      const data: EditNbsInputDto = {
        code: '1012-1/02',
        description: 'Desc atualizada',
      };

      // Act
      await sut.edit(nbs.id, data);

      // Assert
      const updated = await prisma.nbs.findUnique({ where: { id: nbs.id } });
      expect(updated?.code).toBe('1012-1/02');
      expect(updated?.description).toBe('Desc atualizada');
      expect(updated?.active).toBe(true);
    });
  });

  describe('updateStatus', () => {
    it('should update nbs status', async() => {
      // Arrange
      const nbs = await prisma.nbs.create({
        data: { code: '1012-1/01', description: 'Test', active: true },
      });

      // Act
      await sut.updateStatus(nbs.id, false);

      // Assert
      const updated = await prisma.nbs.findUnique({ where: { id: nbs.id } });
      expect(updated?.active).toBe(false);

      // Act (again)
      await sut.updateStatus(nbs.id, true);

      // Assert (again)
      const updated2 = await prisma.nbs.findUnique({ where: { id: nbs.id } });
      expect(updated2?.active).toBe(true);
    });
  });
});
