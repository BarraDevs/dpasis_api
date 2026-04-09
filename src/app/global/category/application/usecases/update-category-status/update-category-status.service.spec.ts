import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CategoryModule } from '../../../category.module';
import { CategoryNotFoundError } from '../../../domain/errors/category-not-found.error';
import { UpdateCategoryStatus } from './update-category-status.service';

describe('UpdateCategoryStatus - Integration tests', () => {
  let sut: UpdateCategoryStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CategoryModule],
    }).compile();

    sut = module.get(UpdateCategoryStatus);
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
  });

  it('should invert active from true to false', async() => {
    const categoryRow = await prisma.category.create({
      data: { name: `Category ${Date.now()}`, active: true },
    });

    await sut.execute(categoryRow.id);

    const updated = await prisma.category.findUnique({ where: { id: categoryRow.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    const categoryRow = await prisma.category.create({
      data: { name: `Category ${Date.now()}`, active: false },
    });

    await sut.execute(categoryRow.id);

    const updated = await prisma.category.findUnique({ where: { id: categoryRow.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const categoryRow = await prisma.category.create({
      data: { name: `Category ${Date.now()}`, active: true },
    });

    const result = await sut.execute(categoryRow.id);

    expect(result).toEqual({ message: 'Status da categoria atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    const categoryRow = await prisma.category.create({
      data: { name: `Manutenção ${Date.now()}`, active: true },
    });

    await sut.execute(categoryRow.id);

    const updated = await prisma.category.findUnique({ where: { id: categoryRow.id } });
    expect(updated?.name).toBe(categoryRow.name);
    expect(updated?.active).toBe(false);
  });
});
