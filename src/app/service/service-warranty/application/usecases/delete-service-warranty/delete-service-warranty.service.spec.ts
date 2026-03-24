import { Test } from '@nestjs/testing';
import { ServiceWarrantyInUseError } from 'src/app/service/service-warranty/domain/errors/service-warranty-in-use.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceWarrantyNotFoundError } from '../../../domain/errors/service-warranty-not-found.error';
import { ServiceWarrantyModule } from '../../../service-warranty.module';
import { DeleteServiceWarranty } from './delete-service-warranty.service';

describe('DeleteServiceWarranty - Integration tests', () => {
  let sut: DeleteServiceWarranty;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceWarrantyModule],
    }).compile();

    sut = module.get(DeleteServiceWarranty);
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

  it('should throw ServiceWarrantyNotFoundError when service warranty does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(ServiceWarrantyNotFoundError);
  });

  it('should throw ServiceWarrantyInUseError when services use the warranty', async() => {
    const warranty = await prisma.serviceWarranty.create({
      data: { name: `Warranty ${Date.now()}`, active: true },
    });

    const [cnae, nbs, indop] = await Promise.all([
      prisma.cnae.create({ data: { code: `CNAE${Date.now()}`, description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: `NBS${Date.now()}`, description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: `IND${Date.now()}`, description: 'INDOP Test', active: true } }),
    ]);
    const cnaeNbsIndop = await prisma.cnaeNbsIndop.create({
      data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
    });

    const [billed, category, deliveryTerm, freight, proposalValidity] = await Promise.all([
      prisma.serviceBilled.create({
        data: { description: 'Billed Test', isJunction: false, installmentDays: [10], active: true },
      }),
      prisma.serviceCategory.create({ data: { name: `Cat ${Date.now()}`, active: true } }),
      prisma.serviceDeliveryTerm.create({ data: { name: `Term ${Date.now()}`, active: true } }),
      prisma.serviceFreight.create({ data: { name: `Freight ${Date.now()}`, active: true } }),
      prisma.serviceProposalValidity.create({ data: { name: `Validity ${Date.now()}`, active: true } }),
    ]);

    await prisma.service.create({
      data: {
        cnaeNbsIndopId: cnaeNbsIndop.id,
        serviceBilledId: billed.id,
        serviceCategoryId: category.id,
        serviceDeliveryTermId: deliveryTerm.id,
        serviceFreightId: freight.id,
        serviceProposalValidityId: proposalValidity.id,
        serviceWarrantyId: warranty.id,
        name: 'Service Test',
        unitPriceInCents: 10000,
        description: 'Service Test',
        isCommercial: true,
        active: true,
      },
    });

    await expect(sut.execute(warranty.id)).rejects.toThrow(ServiceWarrantyInUseError);
    await expect(sut.execute(warranty.id)).rejects.toThrow('Não é possível excluir pois existem serviços vinculados.');

    const stillExists = await prisma.serviceWarranty.findUnique({ where: { id: warranty.id } });
    expect(stillExists).not.toBeNull();
  });

  it('should delete service warranty from database', async() => {
    const serviceWarranty = await prisma.serviceWarranty.create({
      data: { name: `Warranty ${Date.now()}`, active: true },
    });

    await sut.execute(serviceWarranty.id);

    const deleted = await prisma.serviceWarranty.findUnique({ where: { id: serviceWarranty.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    const serviceWarranty = await prisma.serviceWarranty.create({
      data: { name: `Warranty ${Date.now()}`, active: true },
    });

    const result = await sut.execute(serviceWarranty.id);

    expect(result).toEqual({ message: 'Garantia de serviço excluída com sucesso' });
  });
});
