import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientGroupModule } from '../../../client-group.module';
import { ClientGroupDto } from '../../dtos/client-group.dto';
import { FindAllClientGroupQueryDto } from './dtos/find-all-client-group.dto';
import { FindAllClientGroup } from './find-all-client-group.service';

describe('FindAllClientGroup - Integration tests', () => {
  let sut: FindAllClientGroup;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientGroupModule],
    }).compile();

    sut = module.get(FindAllClientGroup);
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

  it('should return empty results when no client groups exist', async() => {
    // Arrange
    const query: FindAllClientGroupQueryDto = {};

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all client groups with pagination', async() => {
    // Arrange
    await prisma.clientGroup.createMany({
      data: [
        { name: 'Grupo 1', active: true },
        { name: 'Grupo 2', active: false },
        { name: 'Grupo 3', active: true },
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
    await prisma.clientGroup.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        name: `Grupo ${i + 1}`,
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
    const first = await prisma.clientGroup.create({
      data: { name: 'B', active: true },
    });
    const second = await prisma.clientGroup.create({
      data: { name: 'A', active: true },
    });
    const third = await prisma.clientGroup.create({
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
    await prisma.clientGroup.createMany({
      data: [
        { name: 'Grupo Premium', active: true },
        { name: 'Grupo Básico', active: true },
        { name: 'Grupo Premium VIP', active: true },
      ],
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10, search: 'Premium' });

    // Assert
    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((g: ClientGroupDto) => g.name.toLowerCase().includes('premium'))).toBe(true);
  });

  it('should return correct ClientGroupDto structure', async() => {
    // Arrange
    const clientGroup = await prisma.clientGroup.create({
      data: { name: 'Grupo Test', active: true },
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data[0]).toEqual<ClientGroupDto>({
      id: clientGroup.id,
      name: clientGroup.name,
      active: clientGroup.active,
      createdAt: clientGroup.createdAt,
      updatedAt: clientGroup.updatedAt,
    });
  });
});
