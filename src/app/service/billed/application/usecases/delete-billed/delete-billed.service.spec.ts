import { Test } from '@nestjs/testing';
import { BilledInUseError } from 'src/app/service/billed/domain/errors/billed-in-use.error';
import { BilledNotFoundError } from 'src/app/service/billed/domain/errors/billed-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { BilledModule } from '../../../billed.module';
import { DeleteBilled } from './delete-billed.service';

describe('DeleteBilled - Integration tests', () => {
  let sut: DeleteBilled;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [BilledModule],
    }).compile();

    sut = module.get(DeleteBilled);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should throw BilledNotFoundError when id does not exist', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(BilledNotFoundError);
  });

  it('should throw BilledInUseError when services reference this billed', async() => {
    const billedRow = await prisma.billed.create({
      data: {
        description: 'Para InUseError',
        isJunction: false,
        installmentDays: [5, 15],
        active: true,
      },
    });

    const [cnae, nbs, indop] = await Promise.all([
      prisma.cnae.create({ data: { code: `CNAE${Date.now()}`, description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: `NBS${Date.now()}`, description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: `IND${Date.now()}`, description: 'INDOP Test', active: true } }),
    ]);
    const cnaeNbsIndop = await prisma.cnaeNbsIndop.create({
      data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
    });

    const [category, deliveryTerm, freight, proposalValidity, warranty] = await Promise.all([
      prisma.category.create({ data: { name: `Cat ${Date.now()}`, active: true } }),
      prisma.deliveryTerm.create({ data: { name: `Term ${Date.now()}`, active: true } }),
      prisma.freight.create({ data: { name: `Freight ${Date.now()}`, active: true } }),
      prisma.proposalValidity.create({ data: { name: `Validity ${Date.now()}`, active: true } }),
      prisma.warranty.create({ data: { name: `Warranty ${Date.now()}`, active: true } }),
    ]);

    await prisma.service.create({
      data: {
        cnaeNbsIndopId: cnaeNbsIndop.id,
        billedId: billedRow.id,
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

    await expect(sut.execute(billedRow.id)).rejects.toThrow(BilledInUseError);
    await expect(sut.execute(billedRow.id)).rejects.toThrow('Não é possível excluir pois existem serviços vinculados.');

    const stillExists = await prisma.billed.findUnique({ where: { id: billedRow.id } });
    expect(stillExists).not.toBeNull();
  });

  it('should delete billed from database', async() => {
    const created = await prisma.billed.create({
      data: {
        description: 'Para deletar',
        isJunction: false,
        installmentDays: [5, 15],
        active: true,
      },
    });

    const result = await sut.execute(created.id);
    expect(result).toEqual({ message: 'Exclusão realizada com sucesso' });

    const deleted = await prisma.billed.findUnique({ where: { id: created.id } });
    expect(deleted).toBeNull();
  });
});
