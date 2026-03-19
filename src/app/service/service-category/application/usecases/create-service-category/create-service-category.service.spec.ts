import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceCategoryAlreadyExistsError } from '../../../domain/errors/service-category-already-exists.error';
import { ServiceCategoryModule } from '../../../service-category.module';
import { CreateServiceCategory } from './create-service-category.service';
import { CreateServiceCategoryInputDto } from './dtos/create-service-category.dto';

describe('CreateServiceCategory - Integration tests', () => {
  let sut: CreateServiceCategory;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceCategoryModule],
    }).compile();

    sut = module.get(CreateServiceCategory);
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

  it('should throw ServiceCategoryAlreadyExistsError when creating with duplicate name', async() => {
    const name = `Category ${Date.now()}-${Math.random()}`;

    const input: CreateServiceCategoryInputDto = { name };
    await sut.execute(input);

    await expect(sut.execute(input)).rejects.toThrow(ServiceCategoryAlreadyExistsError);
  });

  it('should create service category and return id', async() => {
    const input: CreateServiceCategoryInputDto = {
      name: `Manutenção ${Date.now()}-${Math.random()}`,
    };

    const result = await sut.execute(input);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.serviceCategory.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe(input.name);
    expect(saved?.active).toBe(true);
  });

  it('should persist service category in database', async() => {
    const input: CreateServiceCategoryInputDto = {
      name: `Instalação ${Date.now()}-${Math.random()}`,
    };

    const { id } = await sut.execute(input);

    const serviceCategory = await prisma.serviceCategory.findUnique({ where: { id } });
    expect(serviceCategory).toEqual(
      expect.objectContaining({
        id,
        name: input.name,
        active: true,
      }),
    );
    expect(serviceCategory?.createdAt).toBeInstanceOf(Date);
    expect(serviceCategory?.updatedAt).toBeInstanceOf(Date);
  });
});
