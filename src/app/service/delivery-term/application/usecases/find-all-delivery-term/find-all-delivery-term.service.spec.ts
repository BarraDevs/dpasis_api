import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeliveryTermModule } from '../../../delivery-term.module';
import { DeliveryTermDto } from '../../dtos/delivery-term.dto';
import { FindAllDeliveryTermQueryDto } from './dtos/find-all-delivery-term.dto';
import { FindAllDeliveryTerm } from './find-all-delivery-term.service';

describe('FindAllDeliveryTerm - Integration tests', () => {
  let sut: FindAllDeliveryTerm;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [DeliveryTermModule],
    }).compile();

    sut = module.get(FindAllDeliveryTerm);
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

  it('should return empty results when no delivery term records exist', async() => {
    const query: FindAllDeliveryTermQueryDto = {};

    const result = await sut.execute(query);

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all delivery terms with pagination', async() => {
    await prisma.deliveryTerm.createMany({
      data: [
        { name: `Term 1 ${Date.now()}`, active: true },
        { name: `Term 2 ${Date.now()}`, active: false },
        { name: `Term 3 ${Date.now()}`, active: true },
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
    await prisma.deliveryTerm.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        name: `Term ${Date.now()}-${i + 1}`,
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
    const first = await prisma.deliveryTerm.create({
      data: { name: `B-${Date.now()}`, active: true },
    });
    const second = await prisma.deliveryTerm.create({
      data: { name: `A-${Date.now()}`, active: true },
    });
    const third = await prisma.deliveryTerm.create({
      data: { name: `C-${Date.now()}`, active: true },
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data[0].id).toBe(second.id);
    expect(result.data[1].id).toBe(first.id);
    expect(result.data[2].id).toBe(third.id);
  });

  it('should filter by active when active is true', async() => {
    await prisma.deliveryTerm.createMany({
      data: [
        { name: `Term A ${Date.now()}`, active: true },
        { name: `Term B ${Date.now()}`, active: false },
        { name: `Term C ${Date.now()}`, active: true },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, active: true });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: DeliveryTermDto) => d.active)).toBe(true);
  });

  it('should filter by active when active is false', async() => {
    await prisma.deliveryTerm.createMany({
      data: [
        { name: `Term A ${Date.now()}`, active: true },
        { name: `Term B ${Date.now()}`, active: false },
        { name: `Term C ${Date.now()}`, active: false },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, active: false });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: DeliveryTermDto) => !d.active)).toBe(true);
  });

  it('should filter by search in name', async() => {
    await prisma.deliveryTerm.createMany({
      data: [
        { name: `Imediato ${Date.now()}`, active: true },
        { name: `30 dias ${Date.now()}`, active: true },
        { name: `Imediato urgente ${Date.now()}`, active: true },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, search: 'Imediato' });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: DeliveryTermDto) => d.name.toLowerCase().includes('imediato'))).toBe(true);
  });

  it('should return correct DeliveryTermDto structure', async() => {
    const deliveryTermRow = await prisma.deliveryTerm.create({
      data: { name: `Term Test ${Date.now()}`, active: true },
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data[0]).toEqual<DeliveryTermDto>({
      id: deliveryTermRow.id,
      name: deliveryTermRow.name,
      active: deliveryTermRow.active,
      createdAt: deliveryTermRow.createdAt,
      updatedAt: deliveryTermRow.updatedAt,
    });
  });
});
