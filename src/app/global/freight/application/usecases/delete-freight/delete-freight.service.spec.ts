import { Test } from '@nestjs/testing';
import { FreightInUseError } from 'src/app/global/freight/domain/errors/freight-in-use.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FreightNotFoundError } from '../../../domain/errors/freight-not-found.error';
import { FreightModule } from '../../../freight.module';
import { DeleteFreight } from './delete-freight.service';

describe('DeleteFreight - Integration tests', () => {
  let sut: DeleteFreight;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [FreightModule],
    }).compile();

    sut = module.get(DeleteFreight);
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

  it('should throw FreightNotFoundError when freight does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(FreightNotFoundError);
  });

  it('should throw FreightInUseError when services use the freight', async() => {
    const freight = await prisma.freight.create({
      data: { name: `Freight ${Date.now()}`, active: true },
    });

    const [cnae, nbs, indop] = await Promise.all([
      prisma.cnae.create({ data: { code: `CNAE${Date.now()}`, description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: `NBS${Date.now()}`, description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: `IND${Date.now()}`, description: 'INDOP Test', active: true } }),
    ]);
    const cnaeNbsIndop = await prisma.cnaeNbsIndop.create({
      data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
    });

    const [billed, category, deliveryTerm, proposalValidity, warranty] = await Promise.all([
      prisma.billed.create({
        data: { description: 'Billed Test', isJunction: false, installmentDays: [10], active: true },
      }),
      prisma.category.create({ data: { name: `Cat ${Date.now()}`, active: true } }),
      prisma.deliveryTerm.create({ data: { name: `Term ${Date.now()}`, active: true } }),
      prisma.proposalValidity.create({ data: { name: `Validity ${Date.now()}`, active: true } }),
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

    await expect(sut.execute(freight.id)).rejects.toThrow(FreightInUseError);
    await expect(sut.execute(freight.id)).rejects.toThrow('Não é possível excluir pois existem serviços vinculados.');

    const stillExists = await prisma.freight.findUnique({ where: { id: freight.id } });
    expect(stillExists).not.toBeNull();
  });

  it('should delete freight from database', async() => {
    const freightRow = await prisma.freight.create({
      data: { name: `Freight ${Date.now()}`, active: true },
    });

    await sut.execute(freightRow.id);

    const deleted = await prisma.freight.findUnique({ where: { id: freightRow.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    const freightRow = await prisma.freight.create({
      data: { name: `Freight ${Date.now()}`, active: true },
    });

    const result = await sut.execute(freightRow.id);

    expect(result).toEqual({ message: 'Exclusão realizada com sucesso' });
  });
});
