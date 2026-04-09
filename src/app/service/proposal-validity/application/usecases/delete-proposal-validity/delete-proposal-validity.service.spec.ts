import { Test } from '@nestjs/testing';
import { ProposalValidityInUseError } from 'src/app/service/proposal-validity/domain/errors/proposal-validity-in-use.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProposalValidityNotFoundError } from '../../../domain/errors/proposal-validity-not-found.error';
import { ProposalValidityModule } from '../../../proposal-validity.module';
import { DeleteProposalValidity } from './delete-proposal-validity.service';

describe('DeleteProposalValidity - Integration tests', () => {
  let sut: DeleteProposalValidity;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ProposalValidityModule],
    }).compile();

    sut = module.get(DeleteProposalValidity);
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

  it('should throw ProposalValidityNotFoundError when validity does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(ProposalValidityNotFoundError);
  });

  it('should throw ProposalValidityInUseError when services use the proposal validity', async() => {
    const proposalValidity = await prisma.proposalValidity.create({
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
      prisma.billed.create({
        data: { description: 'Billed Test', isJunction: false, installmentDays: [10], active: true },
      }),
      prisma.category.create({ data: { name: `Cat ${Date.now()}`, active: true } }),
      prisma.deliveryTerm.create({ data: { name: `Term ${Date.now()}`, active: true } }),
      prisma.freight.create({ data: { name: `Freight ${Date.now()}`, active: true } }),
      prisma.warranty.create({ data: { name: `Warranty ${Date.now()}`, active: true } }),
    ]);

    await prisma.service.create({
      data: {
        cnaeNbsIndopId: cnaeNbsIndop.id,
        billedId: billed.id,
        categoryId: category.id,
        deliveryTermId: deliveryTerm.id,
        freightId: freight.id,
        proposalValidityId: proposalValidity.id,
        warrantyId: warranty.id,
        name: 'Service Test',
        unitPriceInCents: 10000,
        description: 'Service Test',
        isCommercial: true,
        active: true,
      },
    });

    await expect(sut.execute(proposalValidity.id)).rejects.toThrow(ProposalValidityInUseError);
    await expect(sut.execute(proposalValidity.id)).rejects.toThrow('Não é possível excluir pois existem serviços vinculados.');

    const stillExists = await prisma.proposalValidity.findUnique({ where: { id: proposalValidity.id } });
    expect(stillExists).not.toBeNull();
  });

  it('should delete validity from database', async() => {
    const validityRow = await prisma.proposalValidity.create({
      data: { name: `Validity ${Date.now()}`, active: true },
    });

    await sut.execute(validityRow.id);

    const deleted = await prisma.proposalValidity.findUnique({ where: { id: validityRow.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    const validityRow = await prisma.proposalValidity.create({
      data: { name: `Validity ${Date.now()}`, active: true },
    });

    const result = await sut.execute(validityRow.id);

    expect(result).toEqual({ message: 'Exclusão realizada com sucesso' });
  });
});
