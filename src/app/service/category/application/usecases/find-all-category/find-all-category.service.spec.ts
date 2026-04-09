import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CategoryModule } from '../../../category.module';
import { CategoryDto } from '../../dtos/category.dto';
import { FindAllCategoryQueryDto } from './dtos/find-all-category.dto';
import { FindAllCategory } from './find-all-category.service';

describe('FindAllCategory - Integration tests', () => {
  let sut: FindAllCategory;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CategoryModule],
    }).compile();

    sut = module.get(FindAllCategory);
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

  it('should return empty results when no category records exist', async() => {
    const query: FindAllCategoryQueryDto = {};

    const result = await sut.execute(query);

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all categories with pagination', async() => {
    await prisma.category.createMany({
      data: [
        { name: `Category 1 ${Date.now()}`, active: true },
        { name: `Category 2 ${Date.now()}`, active: false },
        { name: `Category 3 ${Date.now()}`, active: true },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data).toHaveLength(3);
    expect(result.totalItems).toBe(3);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(10);
    expect(result.totalPages).toBe(1);
  });

  it('should paginate results correctly', async() => {
    await prisma.category.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        name: `Category ${Date.now()}-${i + 1}`,
        active: true,
      })),
    });

    const page1 = await sut.execute({ page: 1, size: 10 });
    const page3 = await sut.execute({ page: 3, size: 10 });

    expect(page1.data).toHaveLength(10);
    expect(page1.totalItems).toBe(25);
    expect(page1.currentPage).toBe(1);
    expect(page1.totalPages).toBe(3);

    expect(page3.data).toHaveLength(5);
    expect(page3.currentPage).toBe(3);
  });

  it('should order by name asc', async() => {
    const first = await prisma.category.create({
      data: { name: `B-${Date.now()}`, active: true },
    });
    const second = await prisma.category.create({
      data: { name: `A-${Date.now()}`, active: true },
    });
    const third = await prisma.category.create({
      data: { name: `C-${Date.now()}`, active: true },
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data[0].id).toBe(second.id);
    expect(result.data[1].id).toBe(first.id);
    expect(result.data[2].id).toBe(third.id);
  });

  it('should filter by active when active is true', async() => {
    await prisma.category.createMany({
      data: [
        { name: `Category A ${Date.now()}`, active: true },
        { name: `Category B ${Date.now()}`, active: false },
        { name: `Category C ${Date.now()}`, active: true },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, active: true });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: CategoryDto) => d.active)).toBe(true);
  });

  it('should filter by active when active is false', async() => {
    await prisma.category.createMany({
      data: [
        { name: `Category A ${Date.now()}`, active: true },
        { name: `Category B ${Date.now()}`, active: false },
        { name: `Category C ${Date.now()}`, active: false },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, active: false });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: CategoryDto) => !d.active)).toBe(true);
  });

  it('should filter by search in name', async() => {
    await prisma.category.createMany({
      data: [
        { name: `Manutenção Preventiva ${Date.now()}`, active: true },
        { name: `Instalação ${Date.now()}`, active: true },
        { name: `Manutenção Corretiva ${Date.now()}`, active: true },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, search: 'Manutenção' });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: CategoryDto) => d.name.toLowerCase().includes('manutenção'))).toBe(true);
  });

  it('should return correct CategoryDto structure', async() => {
    const categoryRow = await prisma.category.create({
      data: { name: `Category Test ${Date.now()}`, active: true },
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data[0]).toEqual<CategoryDto>({
      id: categoryRow.id,
      name: categoryRow.name,
      active: categoryRow.active,
      createdAt: categoryRow.createdAt,
      updatedAt: categoryRow.updatedAt,
    });
  });
});
