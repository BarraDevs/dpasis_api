import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDescriptionTypeModule } from '../../../client-description-type.module';
import { ClientDescriptionTypeDto } from '../../dtos/client-description-type.dto';
import { FindAllClientDescriptionTypeQueryDto } from './dtos/find-all-client-description-type.dto';
import { FindAllClientDescriptionType } from './find-all-client-description-type.service';

describe('FindAllClientDescriptionType - Integration tests', () => {
  let sut: FindAllClientDescriptionType;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDescriptionTypeModule],
    }).compile();

    sut = module.get(FindAllClientDescriptionType);
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

  it('should return empty results when no client description types exist', async() => {
    const query: FindAllClientDescriptionTypeQueryDto = {};

    const result = await sut.execute(query);

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all client description types with pagination', async() => {
    await prisma.clientDescriptionType.createMany({
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
    await prisma.clientDescriptionType.createMany({
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
    const first = await prisma.clientDescriptionType.create({
      data: { name: `B-${Date.now()}`, active: true },
    });
    const second = await prisma.clientDescriptionType.create({
      data: { name: `A-${Date.now()}`, active: true },
    });
    const third = await prisma.clientDescriptionType.create({
      data: { name: `C-${Date.now()}`, active: true },
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data[0].id).toBe(second.id);
    expect(result.data[1].id).toBe(first.id);
    expect(result.data[2].id).toBe(third.id);
  });

  it('should filter by search in name', async() => {
    await prisma.clientDescriptionType.createMany({
      data: [
        { name: `Descrição ERP ${Date.now()}`, active: true },
        { name: `Descrição CRM ${Date.now()}`, active: true },
        { name: `Descrição ERP VIP ${Date.now()}`, active: true },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, search: 'ERP' });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: ClientDescriptionTypeDto) => d.name.toLowerCase().includes('erp'))).toBe(true);
  });

  it('should return correct ClientDescriptionTypeDto structure', async() => {
    const clientDescriptionType = await prisma.clientDescriptionType.create({
      data: { name: `Tipo Test ${Date.now()}`, active: true },
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data[0]).toEqual<ClientDescriptionTypeDto>({
      id: clientDescriptionType.id,
      name: clientDescriptionType.name,
      active: clientDescriptionType.active,
      createdAt: clientDescriptionType.createdAt,
      updatedAt: clientDescriptionType.updatedAt,
    });
  });
});
