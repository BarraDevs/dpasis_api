import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CategoryModule } from '../../../category.module';
import { CategoryNotFoundError } from '../../../domain/errors/category-not-found.error';
import { CategoryDto } from '../../dtos/category.dto';
import { FindCategoryById } from './find-category-by-id.service';

describe('FindCategoryById - Integration tests', () => {
  let sut: FindCategoryById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CategoryModule],
    }).compile();

    sut = module.get(FindCategoryById);
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

  it('should throw CategoryNotFoundError when category does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(CategoryNotFoundError);
    await expect(sut.execute(0)).rejects.toThrow('Categoria não encontrada na base de dados.');
  });

  it('should throw CategoryNotFoundError when category is inactive and onlyActive is true', async() => {
    const categoryRow = await prisma.category.create({
      data: { name: `Category Premium ${Date.now()}`, active: false },
    });

    await expect(sut.execute(categoryRow.id, { onlyActive: true })).rejects.toThrow(CategoryNotFoundError);
    await expect(sut.execute(categoryRow.id, { onlyActive: true })).rejects.toThrow('Categoria não encontrada na base de dados.');
  });

  it('should return category by id', async() => {
    const categoryRow = await prisma.category.create({
      data: { name: `Category Premium ${Date.now()}`, active: true },
    });

    const result = await sut.execute(categoryRow.id);

    expect(result).not.toBeNull();
    expect(result.id).toBe(categoryRow.id);
    expect(result.name).toBe(categoryRow.name);
    expect(result.active).toBe(categoryRow.active);
  });

  it('should return all category fields correctly', async() => {
    const categoryRow = await prisma.category.create({
      data: { name: `Category VIP ${Date.now()}`, active: false },
    });

    const result = await sut.execute(categoryRow.id);

    expect(result).toEqual<CategoryDto>({
      id: categoryRow.id,
      name: categoryRow.name,
      active: categoryRow.active,
      createdAt: categoryRow.createdAt,
      updatedAt: categoryRow.updatedAt,
    });
  });
});
