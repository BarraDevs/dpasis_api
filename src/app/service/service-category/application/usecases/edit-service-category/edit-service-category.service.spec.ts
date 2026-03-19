import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceCategoryAlreadyExistsError } from '../../../domain/errors/service-category-already-exists.error';
import { ServiceCategoryNotFoundError } from '../../../domain/errors/service-category-not-found.error';
import { ServiceCategoryModule } from '../../../service-category.module';
import { EditServiceCategoryInputDto } from './dtos/edit-service-category.dto';
import { EditServiceCategory } from './edit-service-category.service';

describe('EditServiceCategory - Integration tests', () => {
  let sut: EditServiceCategory;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceCategoryModule],
    }).compile();

    sut = module.get(EditServiceCategory);
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
    const data: EditServiceCategoryInputDto = { name: `Novo nome ${Date.now()}` };

    await expect(sut.execute(0, data)).rejects.toThrow(ServiceCategoryNotFoundError);
  });

  it('should update service category name', async() => {
    const serviceCategory = await prisma.serviceCategory.create({
      data: { name: `Nome original ${Date.now()}`, active: true },
    });

    const data: EditServiceCategoryInputDto = { name: `Nome atualizado ${Date.now()}` };
    await sut.execute(serviceCategory.id, data);

    const updated = await prisma.serviceCategory.findUnique({ where: { id: serviceCategory.id } });
    expect(updated?.name).toBe(data.name);
    expect(updated?.active).toBe(true);
  });

  it('should return success message', async() => {
    const serviceCategory = await prisma.serviceCategory.create({
      data: { name: `Category ${Date.now()}`, active: true },
    });

    const data: EditServiceCategoryInputDto = { name: `Novo nome ${Date.now()}` };
    const result = await sut.execute(serviceCategory.id, data);

    expect(result).toEqual({ message: 'Categoria de serviço atualizada com sucesso' });
  });

  it('should throw ServiceCategoryAlreadyExistsError when editing to duplicate name', async() => {
    const nameA = `Category A ${Date.now()}`;
    await prisma.serviceCategory.create({ data: { name: nameA, active: true } });
    const serviceCategoryB = await prisma.serviceCategory.create({
      data: { name: `Category B ${Date.now()}`, active: true },
    });

    const data: EditServiceCategoryInputDto = { name: nameA };
    await expect(sut.execute(serviceCategoryB.id, data)).rejects.toThrow(ServiceCategoryAlreadyExistsError);
  });

  it('should allow edit when name belongs to the same service category being edited', async() => {
    const name = `Category ${Date.now()}`;
    const serviceCategory = await prisma.serviceCategory.create({ data: { name, active: true } });

    const data: EditServiceCategoryInputDto = { name };
    await sut.execute(serviceCategory.id, data);

    const updated = await prisma.serviceCategory.findUnique({ where: { id: serviceCategory.id } });
    expect(updated?.name).toBe(name);
    expect(updated?.active).toBe(true);
  });
});
