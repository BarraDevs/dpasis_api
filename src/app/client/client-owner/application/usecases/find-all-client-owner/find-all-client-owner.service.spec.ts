import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientOwnerModule } from '../../../client-owner.module';
import { ClientOwnerDto } from '../../dtos/client-owner.dto';
import { FindAllClientOwnerQueryDto } from './dtos/find-all-client-owner.dto';
import { FindAllClientOwner } from './find-all-client-owner.service';

describe('FindAllClientOwner - Integration tests', () => {
  let sut: FindAllClientOwner;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientOwnerModule],
    }).compile();

    sut = module.get(FindAllClientOwner);
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

  it('should return empty results when no client owners exist', async() => {
    // Arrange
    const query: FindAllClientOwnerQueryDto = {};

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all client owners with pagination', async() => {
    // Arrange
    await prisma.clientOwner.createMany({
      data: [
        { name: 'Proprietário 1', active: true },
        { name: 'Proprietário 2', active: false },
        { name: 'Proprietário 3', active: true },
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
    await prisma.clientOwner.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        name: `Proprietário ${i + 1}`,
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
    await prisma.clientOwner.createMany({
      data: [
        { name: 'Proprietário A', active: true },
        { name: 'Proprietário B', active: false },
        { name: 'Proprietário C', active: true },
      ],
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10, active: true });

    // Assert
    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((o: ClientOwnerDto) => o.active)).toBe(true);
  });

  it('should filter by active when active is false', async() => {
    // Arrange
    await prisma.clientOwner.createMany({
      data: [
        { name: 'Proprietário A', active: true },
        { name: 'Proprietário B', active: false },
        { name: 'Proprietário C', active: false },
      ],
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10, active: false });

    // Assert
    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((o: ClientOwnerDto) => !o.active)).toBe(true);
  });

  it('should order by name asc', async() => {
    // Arrange
    const first = await prisma.clientOwner.create({
      data: { name: 'B', active: true },
    });
    const second = await prisma.clientOwner.create({
      data: { name: 'A', active: true },
    });
    const third = await prisma.clientOwner.create({
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
    await prisma.clientOwner.createMany({
      data: [
        { name: 'Proprietário Premium', active: true },
        { name: 'Proprietário Básico', active: true },
        { name: 'Proprietário Premium VIP', active: true },
      ],
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10, search: 'Premium' });

    // Assert
    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((g: ClientOwnerDto) => g.name.toLowerCase().includes('premium'))).toBe(true);
  });

  it('should return correct ClientOwnerDto structure', async() => {
    // Arrange
    const clientOwner = await prisma.clientOwner.create({
      data: { name: 'Proprietário Test', active: true },
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data[0]).toEqual<ClientOwnerDto>({
      id: clientOwner.id,
      name: clientOwner.name,
      active: clientOwner.active,
      createdAt: clientOwner.createdAt,
      updatedAt: clientOwner.updatedAt,
    });
  });
});
