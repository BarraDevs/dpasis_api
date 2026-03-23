import { Test } from '@nestjs/testing';
import { ServiceFreightInUseError } from 'src/app/service/service-freight/domain/errors/service-freight-in-use.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceFreightNotFoundError } from '../../../domain/errors/service-freight-not-found.error';
import { ServiceFreightModule } from '../../../service-freight.module';
import { DeleteServiceFreight } from './delete-service-freight.service';

describe('DeleteServiceFreight - Integration tests', () => {
  let sut: DeleteServiceFreight;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceFreightModule],
    }).compile();

    sut = module.get(DeleteServiceFreight);
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

  it('should throw ServiceFreightNotFoundError when service freight does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(ServiceFreightNotFoundError);
  });

  it('should throw ServiceFreightInUseError when services use the freight', async() => {
    const freight = await prisma.serviceFreight.create({
      data: { name: `Freight ${Date.now()}`, active: true },
    });

    const [billed, category, deliveryTerm, proposalValidity, warranty] = await Promise.all([
      prisma.serviceBilled.create({
        data: { description: 'Billed Test', isJunction: false, installmentDays: [10], active: true },
      }),
      prisma.serviceCategory.create({ data: { name: `Cat ${Date.now()}`, active: true } }),
      prisma.serviceDeliveryTerm.create({ data: { name: `Term ${Date.now()}`, active: true } }),
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

    await expect(sut.execute(freight.id)).rejects.toThrow(ServiceFreightInUseError);
    await expect(sut.execute(freight.id)).rejects.toThrow('Não é possível excluir pois existem serviços vinculados.');

    const stillExists = await prisma.serviceFreight.findUnique({ where: { id: freight.id } });
    expect(stillExists).not.toBeNull();
  });

  it('should delete service freight from database', async() => {
    const serviceFreight = await prisma.serviceFreight.create({
      data: { name: `Freight ${Date.now()}`, active: true },
    });

    await sut.execute(serviceFreight.id);

    const deleted = await prisma.serviceFreight.findUnique({ where: { id: serviceFreight.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    const serviceFreight = await prisma.serviceFreight.create({
      data: { name: `Freight ${Date.now()}`, active: true },
    });

    const result = await sut.execute(serviceFreight.id);

    expect(result).toEqual({ message: 'Frete de serviço excluído com sucesso' });
  });
});
