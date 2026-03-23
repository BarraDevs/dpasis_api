import { Test } from '@nestjs/testing';
import { ServiceDeliveryTermInUseError } from 'src/app/service/service-delivery-term/domain/errors/service-delivery-term-in-use.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceDeliveryTermNotFoundError } from '../../../domain/errors/service-delivery-term-not-found.error';
import { ServiceDeliveryTermModule } from '../../../service-delivery-term.module';
import { DeleteServiceDeliveryTerm } from './delete-service-delivery-term.service';

describe('DeleteServiceDeliveryTerm - Integration tests', () => {
  let sut: DeleteServiceDeliveryTerm;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceDeliveryTermModule],
    }).compile();

    sut = module.get(DeleteServiceDeliveryTerm);
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

  it('should throw ServiceDeliveryTermNotFoundError when service delivery term does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(ServiceDeliveryTermNotFoundError);
  });

  it('should throw ServiceDeliveryTermInUseError when services use the delivery term', async() => {
    const deliveryTerm = await prisma.serviceDeliveryTerm.create({
      data: { name: `Term ${Date.now()}`, active: true },
    });

    const [billed, category, freight, proposalValidity, warranty] = await Promise.all([
      prisma.serviceBilled.create({
        data: { description: 'Billed Test', isJunction: false, installmentDays: [10], active: true },
      }),
      prisma.serviceCategory.create({ data: { name: `Cat ${Date.now()}`, active: true } }),
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

    await expect(sut.execute(deliveryTerm.id)).rejects.toThrow(ServiceDeliveryTermInUseError);
    await expect(sut.execute(deliveryTerm.id)).rejects.toThrow('Não é possível excluir pois existem serviços vinculados.');

    const stillExists = await prisma.serviceDeliveryTerm.findUnique({ where: { id: deliveryTerm.id } });
    expect(stillExists).not.toBeNull();
  });

  it('should delete service delivery term from database', async() => {
    const serviceDeliveryTerm = await prisma.serviceDeliveryTerm.create({
      data: { name: `Term ${Date.now()}`, active: true },
    });

    await sut.execute(serviceDeliveryTerm.id);

    const deleted = await prisma.serviceDeliveryTerm.findUnique({ where: { id: serviceDeliveryTerm.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    const serviceDeliveryTerm = await prisma.serviceDeliveryTerm.create({
      data: { name: `Term ${Date.now()}`, active: true },
    });

    const result = await sut.execute(serviceDeliveryTerm.id);

    expect(result).toEqual({ message: 'Prazo de entrega excluído com sucesso' });
  });
});
