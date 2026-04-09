import { Test } from '@nestjs/testing';
import { DeliveryTermInUseError } from 'src/app/global/delivery-term/domain/errors/delivery-term-in-use.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeliveryTermModule } from '../../../delivery-term.module';
import { DeliveryTermNotFoundError } from '../../../domain/errors/delivery-term-not-found.error';
import { DeleteDeliveryTerm } from './delete-delivery-term.service';

describe('DeleteDeliveryTerm - Integration tests', () => {
  let sut: DeleteDeliveryTerm;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [DeliveryTermModule],
    }).compile();

    sut = module.get(DeleteDeliveryTerm);
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

  it('should throw DeliveryTermNotFoundError when delivery term does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(DeliveryTermNotFoundError);
  });

  it('should throw DeliveryTermInUseError when services use the delivery term', async() => {
    const deliveryTerm = await prisma.deliveryTerm.create({
      data: { name: `Term ${Date.now()}`, active: true },
    });

    const [cnae, nbs, indop] = await Promise.all([
      prisma.cnae.create({ data: { code: `CNAE${Date.now()}`, description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: `NBS${Date.now()}`, description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: `IND${Date.now()}`, description: 'INDOP Test', active: true } }),
    ]);
    const cnaeNbsIndop = await prisma.cnaeNbsIndop.create({
      data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
    });

    const [billed, category, freight, proposalValidity, warranty] = await Promise.all([
      prisma.billed.create({
        data: { description: 'Billed Test', isJunction: false, installmentDays: [10], active: true },
      }),
      prisma.category.create({ data: { name: `Cat ${Date.now()}`, active: true } }),
      prisma.freight.create({ data: { name: `Freight ${Date.now()}`, active: true } }),
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

    await expect(sut.execute(deliveryTerm.id)).rejects.toThrow(DeliveryTermInUseError);
    await expect(sut.execute(deliveryTerm.id)).rejects.toThrow('Não é possível excluir pois existem serviços vinculados.');

    const stillExists = await prisma.deliveryTerm.findUnique({ where: { id: deliveryTerm.id } });
    expect(stillExists).not.toBeNull();
  });

  it('should delete delivery term from database', async() => {
    const deliveryTermRow = await prisma.deliveryTerm.create({
      data: { name: `Term ${Date.now()}`, active: true },
    });

    await sut.execute(deliveryTermRow.id);

    const deleted = await prisma.deliveryTerm.findUnique({ where: { id: deliveryTermRow.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    const deliveryTermRow = await prisma.deliveryTerm.create({
      data: { name: `Term ${Date.now()}`, active: true },
    });

    const result = await sut.execute(deliveryTermRow.id);

    expect(result).toEqual({ message: 'Exclusão realizada com sucesso' });
  });
});
