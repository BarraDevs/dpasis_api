import { Test } from '@nestjs/testing';
import { ServiceProposalValidityInUseError } from 'src/app/service/service-proposal-validity/domain/errors/service-proposal-validity-in-use.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ServiceProposalValidityNotFoundError } from '../../../domain/errors/service-proposal-validity-not-found.error';
import { ServiceProposalValidityModule } from '../../../service-proposal-validity.module';
import { DeleteServiceProposalValidity } from './delete-service-proposal-validity.service';

describe('DeleteServiceProposalValidity - Integration tests', () => {
  let sut: DeleteServiceProposalValidity;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ServiceProposalValidityModule],
    }).compile();

    sut = module.get(DeleteServiceProposalValidity);
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

  it('should throw ServiceProposalValidityNotFoundError when service proposal validity does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(ServiceProposalValidityNotFoundError);
  });

  it('should throw ServiceProposalValidityInUseError when services use the proposal validity', async() => {
    const proposalValidity = await prisma.serviceProposalValidity.create({
      data: { name: `Validity ${Date.now()}`, active: true },
    });

    const [cnae, nbs, indop] = await Promise.all([
      prisma.cnae.create({ data: { code: `CNAE${Date.now()}`, description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: `NBS${Date.now()}`, description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: `IND${Date.now()}`, description: 'INDOP Test', active: true } }),
    ]);
    const cnaeNbsIndop = await prisma.cnaeNbsIndop.create({
      data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
    });

    const [billed, category, deliveryTerm, freight, warranty] = await Promise.all([
      prisma.serviceBilled.create({
        data: { description: 'Billed Test', isJunction: false, installmentDays: [10], active: true },
      }),
      prisma.serviceCategory.create({ data: { name: `Cat ${Date.now()}`, active: true } }),
      prisma.serviceDeliveryTerm.create({ data: { name: `Term ${Date.now()}`, active: true } }),
      prisma.serviceFreight.create({ data: { name: `Freight ${Date.now()}`, active: true } }),
      prisma.serviceWarranty.create({ data: { name: `Warranty ${Date.now()}`, active: true } }),
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

    await expect(sut.execute(proposalValidity.id)).rejects.toThrow(ServiceProposalValidityInUseError);
    await expect(sut.execute(proposalValidity.id)).rejects.toThrow('Não é possível excluir pois existem serviços vinculados.');

    const stillExists = await prisma.serviceProposalValidity.findUnique({ where: { id: proposalValidity.id } });
    expect(stillExists).not.toBeNull();
  });

  it('should delete service proposal validity from database', async() => {
    const serviceProposalValidity = await prisma.serviceProposalValidity.create({
      data: { name: `Validity ${Date.now()}`, active: true },
    });

    await sut.execute(serviceProposalValidity.id);

    const deleted = await prisma.serviceProposalValidity.findUnique({ where: { id: serviceProposalValidity.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    const serviceProposalValidity = await prisma.serviceProposalValidity.create({
      data: { name: `Validity ${Date.now()}`, active: true },
    });

    const result = await sut.execute(serviceProposalValidity.id);

    expect(result).toEqual({ message: 'Validade de proposta excluída com sucesso' });
  });
});
