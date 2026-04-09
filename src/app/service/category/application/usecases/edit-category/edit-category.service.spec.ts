import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CategoryModule } from '../../../category.module';
import { CategoryAlreadyExistsError } from '../../../domain/errors/category-already-exists.error';
import { CategoryNotFoundError } from '../../../domain/errors/category-not-found.error';
import { EditCategoryInputDto } from './dtos/edit-category.dto';
import { EditCategory } from './edit-category.service';

describe('EditCategory - Integration tests', () => {
  let sut: EditCategory;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CategoryModule],
    }).compile();

    sut = module.get(EditCategory);
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
    const data: EditCategoryInputDto = { name: `Novo nome ${Date.now()}` };

    await expect(sut.execute(0, data)).rejects.toThrow(CategoryNotFoundError);
  });

  it('should update category name', async() => {
    const categoryRow = await prisma.category.create({
      data: { name: `Nome original ${Date.now()}`, active: true },
    });

    const data: EditCategoryInputDto = { name: `Nome atualizado ${Date.now()}` };
    await sut.execute(categoryRow.id, data);

    const updated = await prisma.category.findUnique({ where: { id: categoryRow.id } });
    expect(updated?.name).toBe(data.name);
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const categoryRow = await prisma.category.create({
      data: { name: `Category ${Date.now()}`, active: true },
    });

    const data: EditCategoryInputDto = { name: `Novo nome ${Date.now()}` };
    const result = await sut.execute(categoryRow.id, data);

    expect(result).toEqual({ message: 'Edição realizada com sucesso' });
  });

  it('should throw CategoryAlreadyExistsError when editing to duplicate name', async() => {
    const nameA = `Category A ${Date.now()}`;
    await prisma.category.create({ data: { name: nameA, active: true } });
    const categoryB = await prisma.category.create({
      data: { name: `Category B ${Date.now()}`, active: true },
    });

    const data: EditCategoryInputDto = { name: nameA };
    await expect(sut.execute(categoryB.id, data)).rejects.toThrow(CategoryAlreadyExistsError);
  });

  it('should allow edit when name belongs to the same category being edited', async() => {
    const name = `Category ${Date.now()}`;
    const categoryRow = await prisma.category.create({ data: { name, active: true } });

    const data: EditCategoryInputDto = { name };
    await sut.execute(categoryRow.id, data);

    const updated = await prisma.category.findUnique({ where: { id: categoryRow.id } });
    expect(updated?.name).toBe(name);
    expect(updated?.active).toBe(true);
  });
});
