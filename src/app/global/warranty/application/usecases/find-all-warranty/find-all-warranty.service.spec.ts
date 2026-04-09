import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { WarrantyModule } from '../../../warranty.module';
import { WarrantyDto } from '../../dtos/warranty.dto';
import { FindAllWarrantyQueryDto } from './dtos/find-all-warranty.dto';
import { FindAllWarranty } from './find-all-warranty.service';

describe('FindAllWarranty - Integration tests', () => {
  let sut: FindAllWarranty;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [WarrantyModule],
    }).compile();

    sut = module.get(FindAllWarranty);
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

  it('should return empty results when no warranties exist', async() => {
    const query: FindAllWarrantyQueryDto = {};

    const result = await sut.execute(query);

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all warranties with pagination', async() => {
    await prisma.warranty.createMany({
      data: [
        { name: `Warranty 1 ${Date.now()}`, active: true },
        { name: `Warranty 2 ${Date.now()}`, active: false },
        { name: `Warranty 3 ${Date.now()}`, active: true },
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
    await prisma.warranty.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        name: `Warranty ${Date.now()}-${i + 1}`,
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
    const first = await prisma.warranty.create({
      data: { name: `B-${Date.now()}`, active: true },
    });
    const second = await prisma.warranty.create({
      data: { name: `A-${Date.now()}`, active: true },
    });
    const third = await prisma.warranty.create({
      data: { name: `C-${Date.now()}`, active: true },
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data[0].id).toBe(second.id);
    expect(result.data[1].id).toBe(first.id);
    expect(result.data[2].id).toBe(third.id);
  });

  it('should filter by active when active is true', async() => {
    await prisma.warranty.createMany({
      data: [
        { name: `Warranty A ${Date.now()}`, active: true },
        { name: `Warranty B ${Date.now()}`, active: false },
        { name: `Warranty C ${Date.now()}`, active: true },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, active: true });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: WarrantyDto) => d.active)).toBe(true);
  });

  it('should filter by active when active is false', async() => {
    await prisma.warranty.createMany({
      data: [
        { name: `Warranty A ${Date.now()}`, active: true },
        { name: `Warranty B ${Date.now()}`, active: false },
        { name: `Warranty C ${Date.now()}`, active: false },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, active: false });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: WarrantyDto) => !d.active)).toBe(true);
  });

  it('should filter by search in name', async() => {
    await prisma.warranty.createMany({
      data: [
        { name: `90 dias ${Date.now()}`, active: true },
        { name: `1 ano ${Date.now()}`, active: true },
        { name: `90 dias estendido ${Date.now()}`, active: true },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, search: 'DIAS' });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: WarrantyDto) => d.name.includes('dias'))).toBe(true);
  });

  it('should return correct WarrantyDto structure', async() => {
    const warranty = await prisma.warranty.create({
      data: { name: `Warranty Test ${Date.now()}`, active: true },
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data[0]).toEqual<WarrantyDto>({
      id: warranty.id,
      name: warranty.name,
      active: warranty.active,
      createdAt: warranty.createdAt,
      updatedAt: warranty.updatedAt,
    });
  });
});
