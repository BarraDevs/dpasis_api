import { Test } from '@nestjs/testing';
import { BilledDto } from 'src/app/service/billed/application/dtos/billed.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { BilledModule } from '../../../billed.module';
import { FindAllBilled } from './find-all-billed.service';

describe('FindAllBilled - Integration tests', () => {
  let sut: FindAllBilled;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [BilledModule],
    }).compile();

    sut = module.get(FindAllBilled);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should return empty pagination when no billed exist', async() => {
    const result = await sut.execute({});

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return paginated billed', async() => {
    await prisma.billed.createMany({
      data: [
        { description: `Desc 1 ${Date.now()}`, isJunction: false, installmentDays: [5], active: true },
        { description: `Desc 2 ${Date.now()}`, isJunction: true, installmentDays: [10], active: true },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
  });

  describe('pagination', () => {
    it('should return correct pagination structure with page and size', async() => {
      await prisma.billed.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          description: `Desc ${Date.now()}-${i + 1}`,
          isJunction: false,
          installmentDays: [5, 15],
          active: true,
        })),
      });

      const result = await sut.execute({ page: 1, size: 10 });

      expect(result.currentPage).toBe(1);
      expect(result.itemsPerPage).toBe(10);
      expect(result.totalItems).toBe(25);
      expect(result.totalPages).toBe(3);
      expect(result.data).toHaveLength(10);
    });

    it('should paginate results correctly across pages', async() => {
      await prisma.billed.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          description: `Desc ${Date.now()}-${i + 1}`,
          isJunction: false,
          installmentDays: [5],
          active: true,
        })),
      });

      const page1 = await sut.execute({ page: 1, size: 10 });
      const page2 = await sut.execute({ page: 2, size: 10 });
      const page3 = await sut.execute({ page: 3, size: 10 });

      expect(page1.data).toHaveLength(10);
      expect(page1.currentPage).toBe(1);

      expect(page2.data).toHaveLength(10);
      expect(page2.currentPage).toBe(2);

      expect(page3.data).toHaveLength(5);
      expect(page3.currentPage).toBe(3);
    });
  });

  describe('filter by active', () => {
    it('should filter by active when active is true', async() => {
      await prisma.billed.createMany({
        data: [
          { description: `Ativo A ${Date.now()}`, isJunction: false, installmentDays: [5], active: true },
          { description: `Inativo ${Date.now()}`, isJunction: false, installmentDays: [10], active: false },
          { description: `Ativo B ${Date.now()}`, isJunction: true, installmentDays: [15], active: true },
        ],
      });

      const result = await sut.execute({ page: 1, size: 10, active: true });

      expect(result.data).toHaveLength(2);
      expect(result.totalItems).toBe(2);
      expect(result.data.every((d: BilledDto) => d.active)).toBe(true);
    });

    it('should filter by active when active is false', async() => {
      await prisma.billed.createMany({
        data: [
          { description: `Ativo ${Date.now()}`, isJunction: false, installmentDays: [5], active: true },
          { description: `Inativo A ${Date.now()}`, isJunction: false, installmentDays: [10], active: false },
          { description: `Inativo B ${Date.now()}`, isJunction: true, installmentDays: [15], active: false },
        ],
      });

      const result = await sut.execute({ page: 1, size: 10, active: false });

      expect(result.data).toHaveLength(2);
      expect(result.totalItems).toBe(2);
      expect(result.data.every((d: BilledDto) => !d.active)).toBe(true);
    });
  });

  describe('filter by search', () => {
    it('should filter by search in description (case-insensitive)', async() => {
      await prisma.billed.createMany({
        data: [
          { description: `Manutenção Preventiva ${Date.now()}`, isJunction: false, installmentDays: [5], active: true },
          { description: `Instalação ${Date.now()}`, isJunction: false, installmentDays: [10], active: true },
          { description: `Manutenção Corretiva ${Date.now()}`, isJunction: false, installmentDays: [15], active: true },
        ],
      });

      const result = await sut.execute({ page: 1, size: 10, search: 'manutenção' });

      expect(result.data).toHaveLength(2);
      expect(result.totalItems).toBe(2);
      expect(result.data.every((d: BilledDto) => d.description.toLowerCase().includes('manutenção'))).toBe(true);
    });

    it('should return empty when search does not match any record', async() => {
      await prisma.billed.create({
        data: {
          description: `Manutenção ${Date.now()}`,
          isJunction: false,
          installmentDays: [5],
          active: true,
        },
      });

      const result = await sut.execute({ page: 1, size: 10, search: 'instalação' });

      expect(result.data).toEqual([]);
      expect(result.totalItems).toBe(0);
    });

    it('should search with partial match in description', async() => {
      await prisma.billed.create({
        data: {
          description: 'Serviço de Manutenção Mensal',
          isJunction: false,
          installmentDays: [5, 15],
          active: true,
        },
      });

      const result = await sut.execute({ search: 'Mensal' });

      expect(result.totalItems).toBe(1);
      expect(result.data[0].description).toContain('Mensal');
    });
  });

  describe('combined filters', () => {
    it('should combine search and active filter', async() => {
      await prisma.billed.createMany({
        data: [
          { description: `Manutenção Ativa ${Date.now()}`, isJunction: false, installmentDays: [5], active: true },
          { description: `Manutenção Inativa ${Date.now()}`, isJunction: false, installmentDays: [10], active: false },
          { description: `Instalação Ativa ${Date.now()}`, isJunction: false, installmentDays: [15], active: true },
        ],
      });

      const result = await sut.execute({ page: 1, size: 10, search: 'Manutenção', active: true });

      expect(result.data).toHaveLength(1);
      expect(result.totalItems).toBe(1);
      expect(result.data[0].description).toContain('Manutenção');
      expect(result.data[0].active).toBe(true);
    });
  });

  describe('ordering', () => {
    it('should order results by id asc', async() => {
      const sb1 = await prisma.billed.create({
        data: { description: `Zebra ${Date.now()}`, isJunction: false, installmentDays: [5], active: true },
      });
      const sb2 = await prisma.billed.create({
        data: { description: `Alpha ${Date.now()}`, isJunction: false, installmentDays: [10], active: true },
      });
      const sb3 = await prisma.billed.create({
        data: { description: `Beta ${Date.now()}`, isJunction: false, installmentDays: [15], active: true },
      });

      const result = await sut.execute({ page: 1, size: 10 });

      expect(result.data[0].id).toBe(sb1.id);
      expect(result.data[1].id).toBe(sb2.id);
      expect(result.data[2].id).toBe(sb3.id);
    });
  });

  describe('response structure', () => {
    it('should return correct BilledDto structure with installmentDays', async() => {
      const created = await prisma.billed.create({
        data: {
          description: `Desc Test ${Date.now()}`,
          isJunction: true,
          installmentDays: [5, 15, 25],
          active: false,
        },
      });

      const result = await sut.execute({ page: 1, size: 10 });

      expect(result.data[0]).toEqual<BilledDto>({
        id: created.id,
        description: created.description,
        isJunction: created.isJunction,
        installmentDays: created.installmentDays,
        active: created.active,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
      expect(result.data[0].installmentDays).toEqual([5, 15, 25]);
    });
  });
});
