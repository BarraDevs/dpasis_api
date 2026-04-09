import { Test } from '@nestjs/testing';
import { WarrantyInUseError } from 'src/app/service/warranty/domain/errors/warranty-in-use.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { WarrantyNotFoundError } from '../../../domain/errors/warranty-not-found.error';
import { WarrantyModule } from '../../../warranty.module';
import { DeleteWarranty } from './delete-warranty.service';

describe('DeleteWarranty - Integration tests', () => {
  let sut: DeleteWarranty;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [WarrantyModule],
    }).compile();

    sut = module.get(DeleteWarranty);
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

  it('should throw WarrantyNotFoundError when warranty does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(WarrantyNotFoundError);
  });

  it('should throw WarrantyInUseError when services use the warranty', async() => {
    const warranty = await prisma.warranty.create({
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
      prisma.billed.create({
        data: { description: 'Billed Test', isJunction: false, installmentDays: [10], active: true },
      }),
      prisma.category.create({ data: { name: `Cat ${Date.now()}`, active: true } }),
      prisma.deliveryTerm.create({ data: { name: `Term ${Date.now()}`, active: true } }),
      prisma.freight.create({ data: { name: `Freight ${Date.now()}`, active: true } }),
      prisma.proposalValidity.create({ data: { name: `Validity ${Date.now()}`, active: true } }),
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

    await expect(sut.execute(warranty.id)).rejects.toThrow(WarrantyInUseError);
    await expect(sut.execute(warranty.id)).rejects.toThrow('Não é possível excluir pois existem serviços vinculados.');

    const stillExists = await prisma.warranty.findUnique({ where: { id: warranty.id } });
    expect(stillExists).not.toBeNull();
  });

  it('should delete warranty from database', async() => {
    const warranty = await prisma.warranty.create({
      data: { name: `Warranty ${Date.now()}`, active: true },
    });

    await sut.execute(warranty.id);

    const deleted = await prisma.warranty.findUnique({ where: { id: warranty.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    const warranty = await prisma.warranty.create({
      data: { name: `Warranty ${Date.now()}`, active: true },
    });

    const result = await sut.execute(warranty.id);

    expect(result).toEqual({ message: 'Exclusão realizada com sucesso' });
  });
});
