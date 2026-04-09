import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CategoryModule } from '../../../category.module';
import { CategoryAlreadyExistsError } from '../../../domain/errors/category-already-exists.error';
import { CreateCategory } from './create-category.service';
import { CreateCategoryInputDto } from './dtos/create-category.dto';

describe('CreateCategory - Integration tests', () => {
  let sut: CreateCategory;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CategoryModule],
    }).compile();

    sut = module.get(CreateCategory);
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

  it('should throw CategoryAlreadyExistsError when creating with duplicate name', async() => {
    const name = `Category ${Date.now()}-${Math.random()}`;

    const input: CreateCategoryInputDto = { name };
    await sut.execute(input);

    await expect(sut.execute(input)).rejects.toThrow(CategoryAlreadyExistsError);
  });

  it('should create category and return id', async() => {
    const input: CreateCategoryInputDto = {
      name: `Manutenção ${Date.now()}-${Math.random()}`,
    };

    const result = await sut.execute(input);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.category.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(input.name);
    expect(saved?.active).toBe(true);
  });

  it('should persist category in database', async() => {
    const input: CreateCategoryInputDto = {
      name: `Instalação ${Date.now()}-${Math.random()}`,
    };

    const { id } = await sut.execute(input);

    const categoryRow = await prisma.category.findUnique({ where: { id } });
    expect(categoryRow).toEqual(
      expect.objectContaining({
        id,
        name: input.name,
        active: true,
      }),
    );
    expect(categoryRow?.createdAt).toBeInstanceOf(Date);
    expect(categoryRow?.updatedAt).toBeInstanceOf(Date);
  });
});
