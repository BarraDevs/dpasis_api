import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDepartmentModule } from '../../../client-department.module';
import { ClientDepartmentDto } from '../../dtos/client-department.dto';
import { FindAllClientDepartmentQueryDto } from './dtos/find-all-client-department.dto';
import { FindAllClientDepartment } from './find-all-client-department.service';

describe('FindAllClientDepartment - Integration tests', () => {
  let sut: FindAllClientDepartment;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDepartmentModule],
    }).compile();

    sut = module.get(FindAllClientDepartment);
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
    const query: FindAllClientDepartmentQueryDto = {};

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all client departments with pagination', async() => {
    // Arrange
    await prisma.clientDepartment.createMany({
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
    await prisma.clientDepartment.createMany({
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

  it('should order by name asc', async() => {
    // Arrange
    const first = await prisma.clientDepartment.create({
      data: { name: 'B', active: true },
    });
    const second = await prisma.clientDepartment.create({
      data: { name: 'A', active: true },
    });
    const third = await prisma.clientDepartment.create({
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
    await prisma.clientDepartment.createMany({
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
    expect(result.data.every((d: ClientDepartmentDto) => d.name.toLowerCase().includes('premium'))).toBe(true);
  });

  it('should return correct ClientDepartmentDto structure', async() => {
    // Arrange
    const clientDepartment = await prisma.clientDepartment.create({
      data: { name: 'Departamento Test', active: true },
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data[0]).toEqual<ClientDepartmentDto>({
      id: clientDepartment.id,
      name: clientDepartment.name,
      active: clientDepartment.active,
      createdAt: clientDepartment.createdAt,
      updatedAt: clientDepartment.updatedAt,
    });
  });
});
