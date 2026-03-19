import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceCategoryNotFoundError } from '../../../domain/errors/service-category-not-found.error';
import { ServiceCategoryModule } from '../../../service-category.module';
import { UpdateServiceCategoryStatus } from './update-service-category-status.service';

describe('UpdateServiceCategoryStatus - Integration tests', () => {
  let sut: UpdateServiceCategoryStatus;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceCategoryModule],
    }).compile();

    sut = module.get(UpdateServiceCategoryStatus);
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

  it('should invert active from true to false', async() => {
    const serviceCategory = await prisma.serviceCategory.create({
      data: { name: `Category ${Date.now()}`, active: true },
    });

    await sut.execute(serviceCategory.id);

    const updated = await prisma.serviceCategory.findUnique({ where: { id: serviceCategory.id } });
    expect(updated?.active).toBe(false);
  });

  it('should invert active from false to true', async() => {
    const serviceCategory = await prisma.serviceCategory.create({
      data: { name: `Category ${Date.now()}`, active: false },
    });

    await sut.execute(serviceCategory.id);

    const updated = await prisma.serviceCategory.findUnique({ where: { id: serviceCategory.id } });
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const serviceCategory = await prisma.serviceCategory.create({
      data: { name: `Category ${Date.now()}`, active: true },
    });

    const result = await sut.execute(serviceCategory.id);

    expect(result).toEqual({ message: 'Status da categoria de serviço atualizado com sucesso' });
  });

  it('should preserve other fields when inverting status', async() => {
    const serviceCategory = await prisma.serviceCategory.create({
      data: { name: `Manutenção ${Date.now()}`, active: true },
    });

    await sut.execute(serviceCategory.id);

    const updated = await prisma.serviceCategory.findUnique({ where: { id: serviceCategory.id } });
    expect(updated?.name).toBe(serviceCategory.name);
    expect(updated?.active).toBe(false);
  });
});
