import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceCategoryNotFoundError } from '../../../domain/errors/service-category-not-found.error';
import { ServiceCategoryModule } from '../../../service-category.module';
import { ServiceCategoryDto } from '../../dtos/service-category.dto';
import { FindServiceCategoryById } from './find-service-category-by-id.service';

describe('FindServiceCategoryById - Integration tests', () => {
  let sut: FindServiceCategoryById;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceCategoryModule],
    }).compile();

    sut = module.get(FindServiceCategoryById);
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

  it('should throw ServiceCategoryNotFoundError when service category does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(ServiceCategoryNotFoundError);
    await expect(sut.execute(0)).rejects.toThrow('Categoria de serviço não encontrada na base de dados.');
  });

  it('should throw ServiceCategoryNotFoundError when service category is inactive and onlyActive is true', async() => {
    const serviceCategory = await prisma.serviceCategory.create({
      data: { name: `Category Premium ${Date.now()}`, active: false },
    });

    await expect(sut.execute(serviceCategory.id, { onlyActive: true })).rejects.toThrow(ServiceCategoryNotFoundError);
    await expect(sut.execute(serviceCategory.id, { onlyActive: true })).rejects.toThrow('Categoria de serviço não encontrada na base de dados.');
  });

  it('should return service category by id', async() => {
    const serviceCategory = await prisma.serviceCategory.create({
      data: { name: `Category Premium ${Date.now()}`, active: true },
    });

    const result = await sut.execute(serviceCategory.id);

    expect(result).not.toBeNull();
    expect(result.id).toBe(serviceCategory.id);
    expect(result.name).toBe(serviceCategory.name);
    expect(result.active).toBe(serviceCategory.active);
  });

  it('should return all service category fields correctly', async() => {
    const serviceCategory = await prisma.serviceCategory.create({
      data: { name: `Category VIP ${Date.now()}`, active: false },
    });

    const result = await sut.execute(serviceCategory.id);

    expect(result).toEqual<ServiceCategoryDto>({
      id: serviceCategory.id,
      name: serviceCategory.name,
      active: serviceCategory.active,
      createdAt: serviceCategory.createdAt,
      updatedAt: serviceCategory.updatedAt,
    });
  });
});
