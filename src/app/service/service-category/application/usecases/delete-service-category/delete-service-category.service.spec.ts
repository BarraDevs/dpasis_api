import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceCategoryNotFoundError } from '../../../domain/errors/service-category-not-found.error';
import { ServiceCategoryModule } from '../../../service-category.module';
import { DeleteServiceCategory } from './delete-service-category.service';

describe('DeleteServiceCategory - Integration tests', () => {
  let sut: DeleteServiceCategory;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceCategoryModule],
    }).compile();

    sut = module.get(DeleteServiceCategory);
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
  });

  it('should delete service category from database', async() => {
    const serviceCategory = await prisma.serviceCategory.create({
      data: { name: `Category ${Date.now()}`, active: true },
    });

    await sut.execute(serviceCategory.id);

    const deleted = await prisma.serviceCategory.findUnique({ where: { id: serviceCategory.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    const serviceCategory = await prisma.serviceCategory.create({
      data: { name: `Category ${Date.now()}`, active: true },
    });

    const result = await sut.execute(serviceCategory.id);

    expect(result).toEqual({ message: 'Categoria de serviço excluída com sucesso' });
  });
});
