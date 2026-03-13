import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDriveTypeModule } from '../../../client-drive-type.module';
import { ClientDriveTypeDto } from '../../dtos/client-drive-type.dto';
import { FindAllClientDriveTypeQueryDto } from './dtos/find-all-client-drive-type.dto';
import { FindAllClientDriveType } from './find-all-client-drive-type.service';

describe('FindAllClientDriveType - Integration tests', () => {
  let sut: FindAllClientDriveType;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDriveTypeModule],
    }).compile();

    sut = module.get(FindAllClientDriveType);
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

  it('should return empty results when no client drive types exist', async() => {
    const query: FindAllClientDriveTypeQueryDto = {};

    const result = await sut.execute(query);

    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all client drive types with pagination', async() => {
    await prisma.clientDriveType.createMany({
      data: [
        { name: `Drive 1 ${Date.now()}`, active: true },
        { name: `Drive 2 ${Date.now()}`, active: false },
        { name: `Drive 3 ${Date.now()}`, active: true },
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
    await prisma.clientDriveType.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        name: `Drive ${Date.now()}-${i + 1}`,
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
    const first = await prisma.clientDriveType.create({
      data: { name: `B-${Date.now()}`, active: true },
    });
    const second = await prisma.clientDriveType.create({
      data: { name: `A-${Date.now()}`, active: true },
    });
    const third = await prisma.clientDriveType.create({
      data: { name: `C-${Date.now()}`, active: true },
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data[0].id).toBe(second.id);
    expect(result.data[1].id).toBe(first.id);
    expect(result.data[2].id).toBe(third.id);
  });

  it('should filter by search in name', async() => {
    await prisma.clientDriveType.createMany({
      data: [
        { name: `Google Drive ${Date.now()}`, active: true },
        { name: `OneDrive ${Date.now()}`, active: true },
        { name: `Google Drive Business ${Date.now()}`, active: true },
      ],
    });

    const result = await sut.execute({ page: 1, size: 10, search: 'Google' });

    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: ClientDriveTypeDto) => d.name.toLowerCase().includes('google'))).toBe(true);
  });

  it('should return correct ClientDriveTypeDto structure', async() => {
    const clientDriveType = await prisma.clientDriveType.create({
      data: { name: `Drive Test ${Date.now()}`, active: true },
    });

    const result = await sut.execute({ page: 1, size: 10 });

    expect(result.data[0]).toEqual<ClientDriveTypeDto>({
      id: clientDriveType.id,
      name: clientDriveType.name,
      active: clientDriveType.active,
      createdAt: clientDriveType.createdAt,
      updatedAt: clientDriveType.updatedAt,
    });
  });
});
