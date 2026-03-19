import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientSystemTypeModule } from '../../../client-system-type.module';
import { ClientSystemTypeDto } from '../../dtos/client-system-type.dto';
import { FindAllClientSystemTypeQueryDto } from './dtos/find-all-client-system-type.dto';
import { FindAllClientSystemType } from './find-all-client-system-type.service';

describe('FindAllClientSystemType - Integration tests', () => {
  let sut: FindAllClientSystemType;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientSystemTypeModule],
    }).compile();

    sut = module.get(FindAllClientSystemType);
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

  it('should return empty results when no client system types exist', async() => {
    const query: FindAllClientSystemTypeQueryDto = {};

    const result = await sut.execute(query);

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all client system types with pagination', async() => {
    await prisma.clientSystemType.createMany({
      data: [
        { name: `Tipo 1 ${Date.now()}`, active: true },
        { name: `Tipo 2 ${Date.now()}`, active: false },
        { name: `Tipo 3 ${Date.now()}`, active: true },
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
    await prisma.clientSystemType.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        name: `Tipo ${Date.now()}-${i + 1}`,
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
    const first = await prisma.clientSystemType.create({
      data: { name: `B-${Date.now()}`, active: true },
    });
    const second = await prisma.clientSystemType.create({
      data: { name: `A-${Date.now()}`, active: true },
    });
    const third = await prisma.clientSystemType.create({
      data: { name: `C-${Date.now()}`, active: true },
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data[0].id).toBe(second.id);
    expect(result.data[1].id).toBe(first.id);
    expect(result.data[2].id).toBe(third.id);
  });

  it('should filter by active when active is true', async() => {
    await prisma.clientSystemType.createMany({
      data: [
        { name: `Tipo A ${Date.now()}`, active: true },
        { name: `Tipo B ${Date.now()}`, active: false },
        { name: `Tipo C ${Date.now()}`, active: true },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, active: true });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: ClientSystemTypeDto) => d.active)).toBe(true);
  });

  it('should filter by active when active is false', async() => {
    await prisma.clientSystemType.createMany({
      data: [
        { name: `Tipo A ${Date.now()}`, active: true },
        { name: `Tipo B ${Date.now()}`, active: false },
        { name: `Tipo C ${Date.now()}`, active: false },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, active: false });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: ClientSystemTypeDto) => !d.active)).toBe(true);
  });

  it('should filter by search in name', async() => {
    await prisma.clientSystemType.createMany({
      data: [
        { name: `Sistema ERP ${Date.now()}`, active: true },
        { name: `Sistema CRM ${Date.now()}`, active: true },
        { name: `Sistema ERP VIP ${Date.now()}`, active: true },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, search: 'ERP' });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: ClientSystemTypeDto) => d.name.toLowerCase().includes('erp'))).toBe(true);
  });

  it('should return correct ClientSystemTypeDto structure', async() => {
    const clientSystemType = await prisma.clientSystemType.create({
      data: { name: `Tipo Test ${Date.now()}`, active: true },
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data[0]).toEqual<ClientSystemTypeDto>({
      id: clientSystemType.id,
      name: clientSystemType.name,
      active: clientSystemType.active,
      createdAt: clientSystemType.createdAt,
      updatedAt: clientSystemType.updatedAt,
    });
  });
});
