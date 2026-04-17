import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientAttendanceModule } from '../../../client-attendance.module';
import { ClientAttendanceDto } from '../../dtos/client-attendance.dto';
import { FindAllClientAttendanceQueryDto } from './dtos/find-all-client-attendance.dto';
import { FindAllClientAttendance } from './find-all-client-attendance.service';

describe('FindAllClientAttendance - Integration tests', () => {
  let sut: FindAllClientAttendance;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientAttendanceModule],
    }).compile();

    sut = module.get(FindAllClientAttendance);
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

  it('should return empty results when no client attendances exist', async() => {
    // Arrange
    const query: FindAllClientAttendanceQueryDto = {};

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all client attendances with pagination', async() => {
    // Arrange
    await prisma.clientAttendance.createMany({
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
    await prisma.clientAttendance.createMany({
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
    const first = await prisma.clientAttendance.create({
      data: { name: `B-${Date.now()}`, active: true },
    });
    const second = await prisma.clientAttendance.create({
      data: { name: `A-${Date.now()}`, active: true },
    });
    const third = await prisma.clientAttendance.create({
      data: { name: `C-${Date.now()}`, active: true },
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data[0].id).toBe(second.id);
    expect(result.data[1].id).toBe(first.id);
    expect(result.data[2].id).toBe(third.id);
  });

  it('should filter by active when active is true', async() => {
    // Arrange
    await prisma.clientAttendance.createMany({
      data: [
        { name: `Tipo A ${Date.now()}`, active: true },
        { name: `Tipo B ${Date.now()}`, active: false },
        { name: `Tipo C ${Date.now()}`, active: true },
      ],
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10, active: true });

    // Assert
    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: ClientAttendanceDto) => d.active)).toBe(true);
  });

  it('should filter by active when active is false', async() => {
    // Arrange
    await prisma.clientAttendance.createMany({
      data: [
        { name: `Tipo A ${Date.now()}`, active: true },
        { name: `Tipo B ${Date.now()}`, active: false },
        { name: `Tipo C ${Date.now()}`, active: false },
      ],
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10, active: false });

    // Assert
    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: ClientAttendanceDto) => !d.active)).toBe(true);
  });

  it('should filter by search in name', async() => {
    // Arrange
    await prisma.clientAttendance.createMany({
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
    expect(result.data.every((d: ClientAttendanceDto) => d.name.toLowerCase().includes('técnico'))).toBe(true);
  });

  it('should return correct ClientAttendanceDto structure', async() => {
    // Arrange
    const clientAttendance = await prisma.clientAttendance.create({
      data: { name: `Tipo Test ${Date.now()}`, active: true },
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data[0]).toEqual<ClientAttendanceDto>({
      id: clientAttendance.id,
      name: clientAttendance.name,
      active: clientAttendance.active,
      createdAt: clientAttendance.createdAt,
      updatedAt: clientAttendance.updatedAt,
    });
  });
});
