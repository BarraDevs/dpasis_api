import { Test } from '@nestjs/testing';
import { ServiceCategoryInUseError } from 'src/app/service/service-category/domain/errors/service-category-in-use.error';
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

  it('should throw ServiceCategoryInUseError when services use the category', async() => {
    const category = await prisma.serviceCategory.create({
      data: { name: `Cat ${Date.now()}`, active: true },
    });

    const [billed, deliveryTerm, freight, proposalValidity, warranty] = await Promise.all([
      prisma.serviceBilled.create({
        data: { description: 'Billed Test', isJunction: false, installmentDays: [10], active: true },
      }),
      prisma.serviceDeliveryTerm.create({ data: { name: `Term ${Date.now()}`, active: true } }),
      prisma.serviceFreight.create({ data: { name: `Freight ${Date.now()}`, active: true } }),
      prisma.serviceProposalValidity.create({ data: { name: `Validity ${Date.now()}`, active: true } }),
      prisma.serviceWarranty.create({ data: { name: `Warranty ${Date.now()}`, active: true } }),
    ]);

    await prisma.service.create({
      data: {
        serviceBilledId: billed.id,
        serviceCategoryId: category.id,
        serviceDeliveryTermId: deliveryTerm.id,
        serviceFreightId: freight.id,
        serviceProposalValidityId: proposalValidity.id,
        serviceWarrantyId: warranty.id,
        name: 'Service Test',
      },
    });

    await expect(sut.execute(category.id)).rejects.toThrow(ServiceCategoryInUseError);
    await expect(sut.execute(category.id)).rejects.toThrow('Não é possível excluir pois existem serviços vinculados.');

    const stillExists = await prisma.serviceCategory.findUnique({ where: { id: category.id } });
    expect(stillExists).not.toBeNull();
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
