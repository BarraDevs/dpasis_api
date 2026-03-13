import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientAttendanceTypeModule } from '../../../client-attendance-type.module';
import { ClientAttendanceTypeDto } from '../../dtos/client-attendance-type.dto';
import { FindAllClientAttendanceTypeQueryDto } from './dtos/find-all-client-attendance-type.dto';
import { FindAllClientAttendanceType } from './find-all-client-attendance-type.service';

describe('FindAllClientAttendanceType - Integration tests', () => {
  let sut: FindAllClientAttendanceType;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientAttendanceTypeModule],
    }).compile();

    sut = module.get(FindAllClientAttendanceType);
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

  it('should return empty results when no client attendance types exist', async() => {
    // Arrange
    const query: FindAllClientAttendanceTypeQueryDto = {};

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all client attendance types with pagination', async() => {
    // Arrange
    await prisma.clientAttendanceType.createMany({
      data: [
        { name: `Tipo 1 ${Date.now()}`, active: true },
        { name: `Tipo 2 ${Date.now()}`, active: false },
        { name: `Tipo 3 ${Date.now()}`, active: true },
      ],
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data).toHaveLength(3);
    expect(result.totalItems).toBe(3);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(10);
    expect(result.totalPages).toBe(1);
  });

  it('should paginate results correctly', async() => {
    // Arrange
    await prisma.clientAttendanceType.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        name: `Tipo ${Date.now()}-${i + 1}`,
        active: true,
      })),
    });

    // Act
    const page1 = await sut.execute({ page: 1, size: 10 });
    const page3 = await sut.execute({ page: 3, size: 10 });

    // Assert
    expect(page1.data).toHaveLength(10);
    expect(page1.totalItems).toBe(25);
    expect(page1.currentPage).toBe(1);
    expect(page1.totalPages).toBe(3);

    expect(page3.data).toHaveLength(5);
    expect(page3.currentPage).toBe(3);
  });

  it('should order by name asc', async() => {
    // Arrange
    const first = await prisma.clientAttendanceType.create({
      data: { name: `B-${Date.now()}`, active: true },
    });
    const second = await prisma.clientAttendanceType.create({
      data: { name: `A-${Date.now()}`, active: true },
    });
    const third = await prisma.clientAttendanceType.create({
      data: { name: `C-${Date.now()}`, active: true },
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data[0].id).toBe(second.id);
    expect(result.data[1].id).toBe(first.id);
    expect(result.data[2].id).toBe(third.id);
  });

  it('should filter by search in name', async() => {
    // Arrange
    await prisma.clientAttendanceType.createMany({
      data: [
        { name: `Suporte Técnico ${Date.now()}`, active: true },
        { name: `Suporte Comercial ${Date.now()}`, active: true },
        { name: `Suporte Técnico VIP ${Date.now()}`, active: true },
      ],
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10, search: 'Técnico' });

    // Assert
    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: ClientAttendanceTypeDto) => d.name.toLowerCase().includes('técnico'))).toBe(true);
  });

  it('should return correct ClientAttendanceTypeDto structure', async() => {
    // Arrange
    const clientAttendanceType = await prisma.clientAttendanceType.create({
      data: { name: `Tipo Test ${Date.now()}`, active: true },
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data[0]).toEqual<ClientAttendanceTypeDto>({
      id: clientAttendanceType.id,
      name: clientAttendanceType.name,
      active: clientAttendanceType.active,
      createdAt: clientAttendanceType.createdAt,
      updatedAt: clientAttendanceType.updatedAt,
    });
  });
});
