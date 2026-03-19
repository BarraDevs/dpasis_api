import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceCategoryModule } from '../../../service-category.module';
import { ServiceCategoryDto } from '../../dtos/service-category.dto';
import { FindAllServiceCategoryQueryDto } from './dtos/find-all-service-category.dto';
import { FindAllServiceCategory } from './find-all-service-category.service';

describe('FindAllServiceCategory - Integration tests', () => {
  let sut: FindAllServiceCategory;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceCategoryModule],
    }).compile();

    sut = module.get(FindAllServiceCategory);
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

  it('should return empty results when no service categories exist', async() => {
    const query: FindAllServiceCategoryQueryDto = {};

    const result = await sut.execute(query);

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all service categories with pagination', async() => {
    await prisma.serviceCategory.createMany({
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
    await prisma.serviceCategory.createMany({
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
    const first = await prisma.serviceCategory.create({
      data: { name: `B-${Date.now()}`, active: true },
    });
    const second = await prisma.serviceCategory.create({
      data: { name: `A-${Date.now()}`, active: true },
    });
    const third = await prisma.serviceCategory.create({
      data: { name: `C-${Date.now()}`, active: true },
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data[0].id).toBe(second.id);
    expect(result.data[1].id).toBe(first.id);
    expect(result.data[2].id).toBe(third.id);
  });

  it('should filter by active when active is true', async() => {
    await prisma.serviceCategory.createMany({
      data: [
        { name: `Category A ${Date.now()}`, active: true },
        { name: `Category B ${Date.now()}`, active: false },
        { name: `Category C ${Date.now()}`, active: true },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, active: true });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: ServiceCategoryDto) => d.active)).toBe(true);
  });

  it('should filter by active when active is false', async() => {
    await prisma.serviceCategory.createMany({
      data: [
        { name: `Category A ${Date.now()}`, active: true },
        { name: `Category B ${Date.now()}`, active: false },
        { name: `Category C ${Date.now()}`, active: false },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, active: false });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: ServiceCategoryDto) => !d.active)).toBe(true);
  });

  it('should filter by search in name', async() => {
    await prisma.serviceCategory.createMany({
      data: [
        { name: `Manutenção Preventiva ${Date.now()}`, active: true },
        { name: `Instalação ${Date.now()}`, active: true },
        { name: `Manutenção Corretiva ${Date.now()}`, active: true },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, search: 'Manutenção' });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: ServiceCategoryDto) => d.name.toLowerCase().includes('manutenção'))).toBe(true);
  });

  it('should return correct ServiceCategoryDto structure', async() => {
    const serviceCategory = await prisma.serviceCategory.create({
      data: { name: `Category Test ${Date.now()}`, active: true },
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data[0]).toEqual<ServiceCategoryDto>({
      id: serviceCategory.id,
      name: serviceCategory.name,
      active: serviceCategory.active,
      createdAt: serviceCategory.createdAt,
      updatedAt: serviceCategory.updatedAt,
    });
  });
});
