import { Test } from '@nestjs/testing';
import { CnaeDto } from 'src/app/cnae/cnae/application/dtos/cnae.dto';
import { CreateCnaeInputDto } from 'src/app/cnae/cnae/application/usecases/create-cnae/dtos/create-cnae.dto';
import { EditCnaeInputDto } from 'src/app/cnae/cnae/application/usecases/edit-cnae/dtos/edit-cnae.dto';
import { FindAllCnaeQueryDto } from 'src/app/cnae/cnae/application/usecases/find-all-cnae/dtos/find-all-cnae.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CnaeDaoAdapterPrisma } from './cnae-prisma.dao';

describe('CnaeDaoAdapterPrisma - Integration tests', () => {
  let sut: CnaeDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [CnaeDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(CnaeDaoAdapterPrisma);
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
    it('should return empty array when no cnaes exist', async() => {
      // Arrange
      const query: FindAllCnaeQueryDto = {};

      // Act
      const [cnaes, total] = await sut.findAll(query);

      // Assert
      expect(cnaes).toEqual([]);
      expect(total).toBe(0);
    });

    it('should return all cnaes with default pagination', async() => {
      // Arrange
      await prisma.cnae.createMany({
        data: [
          { code: '1012-1/01', description: 'Desc 1', active: true },
          { code: '1012-1/02', description: 'Desc 2', active: false },
        ],
      });
      const query: FindAllCnaeQueryDto = {};

      // Act
      const [cnaes, total] = await sut.findAll(query);

      // Assert
      expect(cnaes).toHaveLength(2);
      expect(total).toBe(2);
    });

    it('should paginate results correctly', async() => {
      // Arrange
      await prisma.cnae.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          code: `1012-1/${String(i + 1).padStart(2, '0')}`,
          description: `Desc ${i + 1}`,
          active: true,
        })),
      });

      // Act
      const [cnaes, total] = await sut.findAll({ page: 1, size: 10 });
      const [cnaes2, total2] = await sut.findAll({ page: 3, size: 10 });

      // Assert
      expect(cnaes).toHaveLength(10);
      expect(total).toBe(25);
      expect(cnaes2).toHaveLength(5);
      expect(total2).toBe(25);
    });

    it('should search in code and description (case-insensitive)', async() => {
      // Arrange
      await prisma.cnae.createMany({
        data: [
          { code: '1012-1/01', description: 'Fabricação de alimentos', active: true },
          { code: '1012-1/02', description: 'Comércio', active: true },
        ],
      });
      const query: FindAllCnaeQueryDto = { search: 'fabricação' };

      // Act
      const [cnaes, total] = await sut.findAll(query);

      // Assert
      expect(cnaes).toHaveLength(1);
      expect(total).toBe(1);
      expect(cnaes[0].description).toBe('Fabricação de alimentos');
    });

    it('should return results ordered by code asc', async() => {
      // Arrange
      const c1 = await prisma.cnae.create({
        data: { code: 'A', description: 'A', active: true },
      });
      const c2 = await prisma.cnae.create({
        data: { code: 'B', description: 'B', active: true },
      });
      const query: FindAllCnaeQueryDto = {};

      // Act
      const [cnaes] = await sut.findAll(query);

      // Assert
      expect(cnaes).toHaveLength(2);
      expect(cnaes[0].code).toBe(c1.code);
      expect(cnaes[1].code).toBe(c2.code);
    });

    it('should return all cnae fields correctly', async() => {
      // Arrange
      const created = await prisma.cnae.create({
        data: { code: '1012-1/01', description: 'Test', active: true },
      });
      const query: FindAllCnaeQueryDto = {};

      // Act
      const [cnaes] = await sut.findAll(query);

      // Assert
      expect(cnaes).toHaveLength(1);
      expect(cnaes[0]).toEqual<CnaeDto>({
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
    it('should return null when cnae does not exist', async() => {
      // Arrange
      const id = 0;

      // Act
      const result = await sut.findById(id);

      // Assert
      expect(result).toBeNull();
    });

    it('should return cnae by id', async() => {
      // Arrange
      const created = await prisma.cnae.create({
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
    it('should return null when cnae does not exist', async() => {
      // Arrange
      await prisma.cnae.create({
        data: { code: '1012-1/01', description: 'Test', active: true },
      });

      // Act
      const result = await sut.findByCode('1012-1/02');

      // Assert
      expect(result).toBeNull();
    });

    it('should return cnae by code', async() => {
      // Arrange
      const created = await prisma.cnae.create({
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

    it('should find cnae by code (case-insensitive)', async() => {
      // Arrange
      const created = await prisma.cnae.create({
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
    it('should create cnae and return id', async() => {
      // Arrange
      const data: CreateCnaeInputDto = {
        code: '1012-1/01',
        description: 'Fabricação de produtos alimentícios',
      };

      // Act
      const id = await sut.save(data);

      // Assert
      expect(id).toBeDefined();
      expect(typeof id).toBe('number');

      const saved = await prisma.cnae.findUnique({ where: { id } });
      expect(saved).not.toBeNull();
      expect(saved?.code).toBe(data.code);
      expect(saved?.description).toBe(data.description);
      expect(saved?.active).toBe(true);
    });
  });

  describe('edit', () => {
    it('should update cnae code and description', async() => {
      // Arrange
      const cnae = await prisma.cnae.create({
        data: { code: '1012-1/01', description: 'Desc original', active: true },
      });
      const data: EditCnaeInputDto = {
        code: '1012-1/02',
        description: 'Desc atualizada',
      };

      // Act
      await sut.edit(cnae.id, data);

      // Assert
      const updated = await prisma.cnae.findUnique({ where: { id: cnae.id } });
      expect(updated?.code).toBe('1012-1/02');
      expect(updated?.description).toBe('Desc atualizada');
      expect(updated?.active).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete cnae from database', async() => {
      // Arrange
      const cnae = await prisma.cnae.create({
        data: { code: '1012-1/01', description: 'Test', active: true },
      });

      // Act
      await sut.delete(cnae.id);

      // Assert
      const deleted = await prisma.cnae.findUnique({ where: { id: cnae.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update cnae status', async() => {
      // Arrange
      const cnae = await prisma.cnae.create({
        data: { code: '1012-1/01', description: 'Test', active: true },
      });

      // Act
      await sut.updateStatus(cnae.id, false);

      // Assert
      const updated = await prisma.cnae.findUnique({ where: { id: cnae.id } });
      expect(updated?.active).toBe(false);

      // Act (again)
      await sut.updateStatus(cnae.id, true);

      // Assert (again)
      const updated2 = await prisma.cnae.findUnique({ where: { id: cnae.id } });
      expect(updated2?.active).toBe(true);
    });
  });
});
