import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FreightModule } from '../../../freight.module';
import { FreightDto } from '../../dtos/freight.dto';
import { FindAllFreightQueryDto } from './dtos/find-all-freight.dto';
import { FindAllFreight } from './find-all-freight.service';

describe('FindAllFreight - Integration tests', () => {
  let sut: FindAllFreight;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [FreightModule],
    }).compile();

    sut = module.get(FindAllFreight);
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

  it('should return empty results when no freight records exist', async() => {
    const query: FindAllFreightQueryDto = {};

    const result = await sut.execute(query);

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all freights with pagination', async() => {
    await prisma.freight.createMany({
      data: [
        { name: `Freight 1 ${Date.now()}`, active: true },
        { name: `Freight 2 ${Date.now()}`, active: false },
        { name: `Freight 3 ${Date.now()}`, active: true },
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
    await prisma.freight.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        name: `Freight ${Date.now()}-${i + 1}`,
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
    const first = await prisma.freight.create({
      data: { name: `B-${Date.now()}`, active: true },
    });
    const second = await prisma.freight.create({
      data: { name: `A-${Date.now()}`, active: true },
    });
    const third = await prisma.freight.create({
      data: { name: `C-${Date.now()}`, active: true },
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data[0].id).toBe(second.id);
    expect(result.data[1].id).toBe(first.id);
    expect(result.data[2].id).toBe(third.id);
  });

  it('should filter by active when active is true', async() => {
    await prisma.freight.createMany({
      data: [
        { name: `Freight A ${Date.now()}`, active: true },
        { name: `Freight B ${Date.now()}`, active: false },
        { name: `Freight C ${Date.now()}`, active: true },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, active: true });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: FreightDto) => d.active)).toBe(true);
  });

  it('should filter by active when active is false', async() => {
    await prisma.freight.createMany({
      data: [
        { name: `Freight A ${Date.now()}`, active: true },
        { name: `Freight B ${Date.now()}`, active: false },
        { name: `Freight C ${Date.now()}`, active: false },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, active: false });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: FreightDto) => !d.active)).toBe(true);
  });

  it('should filter by search in name', async() => {
    await prisma.freight.createMany({
      data: [
        { name: `CIF Nacional ${Date.now()}`, active: true },
        { name: `FOB ${Date.now()}`, active: true },
        { name: `CIF Internacional ${Date.now()}`, active: true },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, search: 'CIF' });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: FreightDto) => d.name.toLowerCase().includes('cif'))).toBe(true);
  });

  it('should return correct FreightDto structure', async() => {
    const freightRow = await prisma.freight.create({
      data: { name: `Freight Test ${Date.now()}`, active: true },
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data[0]).toEqual<FreightDto>({
      id: freightRow.id,
      name: freightRow.name,
      active: freightRow.active,
      createdAt: freightRow.createdAt,
      updatedAt: freightRow.updatedAt,
    });
  });
});
