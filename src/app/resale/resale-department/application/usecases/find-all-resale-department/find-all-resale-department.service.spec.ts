import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ResaleDepartmentModule } from '../../../resale-department.module';
import { ResaleDepartmentDto } from '../../dtos/resale-department.dto';
import { FindAllResaleDepartmentQueryDto } from './dtos/find-all-resale-department.dto';
import { FindAllResaleDepartment } from './find-all-resale-department.service';

describe('FindAllResaleDepartment - Integration tests', () => {
  let sut: FindAllResaleDepartment;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ResaleDepartmentModule],
    }).compile();

    sut = module.get(FindAllResaleDepartment);
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

  it('should return empty results when no client departments exist', async() => {
    // Arrange
    const query: FindAllResaleDepartmentQueryDto = {};

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all client departments with pagination', async() => {
    // Arrange
    await prisma.resaleDepartment.createMany({
      data: [
        { name: 'Departamento 1', active: true },
        { name: 'Departamento 2', active: false },
        { name: 'Departamento 3', active: true },
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
    await prisma.resaleDepartment.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        name: `Departamento ${i + 1}`,
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

  it('should filter by active when active is true', async() => {
    // Arrange
    await prisma.resaleDepartment.createMany({
      data: [
        { name: 'Departamento A', active: true },
        { name: 'Departamento B', active: false },
        { name: 'Departamento C', active: true },
      ],
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10, active: true });

    // Assert
    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: ResaleDepartmentDto) => d.active)).toBe(true);
  });

  it('should filter by active when active is false', async() => {
    // Arrange
    await prisma.resaleDepartment.createMany({
      data: [
        { name: 'Departamento A', active: true },
        { name: 'Departamento B', active: false },
        { name: 'Departamento C', active: false },
      ],
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10, active: false });

    // Assert
    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: ResaleDepartmentDto) => !d.active)).toBe(true);
  });

  it('should order by name asc', async() => {
    // Arrange
    const first = await prisma.resaleDepartment.create({
      data: { name: 'B', active: true },
    });
    const second = await prisma.resaleDepartment.create({
      data: { name: 'A', active: true },
    });
    const third = await prisma.resaleDepartment.create({
      data: { name: 'C', active: true },
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
    await prisma.resaleDepartment.createMany({
      data: [
        { name: 'Departamento Premium', active: true },
        { name: 'Departamento Básico', active: true },
        { name: 'Departamento Premium VIP', active: true },
      ],
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10, search: 'Premium' });

    // Assert
    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((d: ResaleDepartmentDto) => d.name.toLowerCase().includes('premium'))).toBe(true);
  });

  it('should return correct ResaleDepartmentDto structure', async() => {
    // Arrange
    const resaleDepartment = await prisma.resaleDepartment.create({
      data: { name: 'Departamento Test', active: true },
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data[0]).toEqual<ResaleDepartmentDto>({
      id: resaleDepartment.id,
      name: resaleDepartment.name,
      active: resaleDepartment.active,
      createdAt: resaleDepartment.createdAt,
      updatedAt: resaleDepartment.updatedAt,
    });
  });
});
