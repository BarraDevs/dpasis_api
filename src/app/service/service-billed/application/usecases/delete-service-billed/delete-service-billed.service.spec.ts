import { Test } from '@nestjs/testing';
import { ServiceBilledInUseError } from 'src/app/service/service-billed/domain/errors/service-billed-in-use.error';
import { ServiceBilledNotFoundError } from 'src/app/service/service-billed/domain/errors/service-billed-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceBilledModule } from '../../../service-billed.module';
import { DeleteServiceBilled } from './delete-service-billed.service';

describe('DeleteServiceBilled - Integration tests', () => {
  let sut: DeleteServiceBilled;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceBilledModule],
    }).compile();

    sut = module.get(DeleteServiceBilled);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should throw ServiceBilledNotFoundError when id does not exist', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(ServiceBilledNotFoundError);
  });

  it('should throw ServiceBilledInUseError when services use the service billed', async() => {
    const serviceBilled = await prisma.serviceBilled.create({
      data: {
        description: 'Para InUseError',
        isJunction: false,
        installmentDays: [5, 15],
        active: true,
      },
    });

    const [category, deliveryTerm, freight, proposalValidity, warranty] = await Promise.all([
      prisma.serviceCategory.create({ data: { name: `Cat ${Date.now()}`, active: true } }),
      prisma.serviceDeliveryTerm.create({ data: { name: `Term ${Date.now()}`, active: true } }),
      prisma.serviceFreight.create({ data: { name: `Freight ${Date.now()}`, active: true } }),
      prisma.serviceProposalValidity.create({ data: { name: `Validity ${Date.now()}`, active: true } }),
      prisma.serviceWarranty.create({ data: { name: `Warranty ${Date.now()}`, active: true } }),
    ]);

    await prisma.service.create({
      data: {
        serviceBilledId: serviceBilled.id,
        serviceCategoryId: category.id,
        serviceDeliveryTermId: deliveryTerm.id,
        serviceFreightId: freight.id,
        serviceProposalValidityId: proposalValidity.id,
        serviceWarrantyId: warranty.id,
        name: 'Service Test',
      },
    });

    await expect(sut.execute(serviceBilled.id)).rejects.toThrow(ServiceBilledInUseError);
    await expect(sut.execute(serviceBilled.id)).rejects.toThrow('Não é possível excluir pois existem serviços vinculados.');

    const stillExists = await prisma.serviceBilled.findUnique({ where: { id: serviceBilled.id } });
    expect(stillExists).not.toBeNull();
  });

  it('should delete billed service from database', async() => {
    const created = await prisma.serviceBilled.create({
      data: {
        description: 'Para deletar',
        isJunction: false,
        installmentDays: [5, 15],
        active: true,
      },
    });

    const result = await sut.execute(created.id);
    expect(result).toEqual({ message: 'Exclusão realizada com sucesso' });

    const deleted = await prisma.serviceBilled.findUnique({ where: { id: created.id } });
    expect(deleted).toBeNull();
  });
});
