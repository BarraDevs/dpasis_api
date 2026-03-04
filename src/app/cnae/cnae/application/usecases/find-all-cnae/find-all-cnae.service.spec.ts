import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CnaeModule } from '../../../cnae.module';
import { CnaeDto } from '../../dtos/cnae.dto';
import { FindAllCnaeQueryDto } from './dtos/find-all-cnae.dto';
import { FindAllCnae } from './find-all-cnae.service';

describe('FindAllCnae - Integration tests', () => {
  let sut: FindAllCnae;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CnaeModule],
    }).compile();

    sut = module.get(FindAllCnae);
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

  it('should return empty results when no cnaes exist', async() => {
    // Arrange
    const query: FindAllCnaeQueryDto = {};

    // Act
    const result = await sut.execute(query);

    // Assert
    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should return all cnaes with pagination', async() => {
    // Arrange
    await prisma.cnae.createMany({
      data: [
        { code: '1012-1/01', description: 'Desc 1', active: true },
        { code: '1012-1/02', description: 'Desc 2', active: false },
        { code: '1012-1/03', description: 'Desc 3', active: true },
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
    await prisma.cnae.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        code: `1012-1/${String(i + 1).padStart(2, '0')}`,
        description: `Desc ${i + 1}`,
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

  it('should order by code asc', async() => {
    // Arrange
    const first = await prisma.cnae.create({
      data: { code: 'B', description: 'B', active: true },
    });
    const second = await prisma.cnae.create({
      data: { code: 'A', description: 'A', active: true },
    });
    const third = await prisma.cnae.create({
      data: { code: 'C', description: 'C', active: true },
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data[0].id).toBe(second.id);
    expect(result.data[1].id).toBe(first.id);
    expect(result.data[2].id).toBe(third.id);
  });

  it('should filter by search in code and description', async() => {
    // Arrange
    await prisma.cnae.createMany({
      data: [
        { code: '1012-1/01', description: 'Fabricação de alimentos', active: true },
        { code: '1012-1/02', description: 'Comércio de produtos', active: true },
        { code: '2012-1/01', description: 'Fabricação de bebidas', active: true },
      ],
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10, search: 'Fabricação' });

    // Assert
    expect(result.data).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.data.every((c: CnaeDto) =>
      c.description.toLowerCase().includes('fabricação'),
    )).toBe(true);
  });

  it('should return correct CnaeDto structure', async() => {
    // Arrange
    const cnae = await prisma.cnae.create({
      data: { code: '1012-1/01', description: 'Test', active: true },
    });

    // Act
    const result = await sut.execute({ page: 1, size: 10 });

    // Assert
    expect(result.data[0]).toEqual<CnaeDto>({
      id: cnae.id,
      code: cnae.code,
      description: cnae.description,
      active: cnae.active,
      createdAt: cnae.createdAt,
      updatedAt: cnae.updatedAt,
    });
  });
});
