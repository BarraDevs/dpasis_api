import { Test } from '@nestjs/testing';
import { CategoryInUseError } from 'src/app/global/category/domain/errors/category-in-use.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CategoryModule } from '../../../category.module';
import { CategoryNotFoundError } from '../../../domain/errors/category-not-found.error';
import { DeleteCategory } from './delete-category.service';

describe('DeleteCategory - Integration tests', () => {
  let sut: DeleteCategory;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CategoryModule],
    }).compile();

    sut = module.get(DeleteCategory);
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

  it('should throw CategoryNotFoundError when category does not exist', async() => {
    await expect(sut.execute(0)).rejects.toThrow(CategoryNotFoundError);
  });

  it('should throw CategoryInUseError when services use the category', async() => {
    const category = await prisma.category.create({
      data: { name: `Cat ${Date.now()}`, active: true },
    });

    const [cnae, nbs, indop] = await Promise.all([
      prisma.cnae.create({ data: { code: `CNAE${Date.now()}`, description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: `NBS${Date.now()}`, description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: `IND${Date.now()}`, description: 'INDOP Test', active: true } }),
    ]);
    const cnaeNbsIndop = await prisma.cnaeNbsIndop.create({
      data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
    });

    const [billed, deliveryTerm, freight, proposalValidity, warranty] = await Promise.all([
      prisma.billed.create({
        data: { description: 'Billed Test', isJunction: false, installmentDays: [10], active: true },
      }),
      prisma.deliveryTerm.create({ data: { name: `Term ${Date.now()}`, active: true } }),
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

    await expect(sut.execute(category.id)).rejects.toThrow(CategoryInUseError);
    await expect(sut.execute(category.id)).rejects.toThrow('Não é possível excluir pois existem serviços vinculados.');

    const stillExists = await prisma.category.findUnique({ where: { id: category.id } });
    expect(stillExists).not.toBeNull();
  });

  it('should delete category from database', async() => {
    const categoryRow = await prisma.category.create({
      data: { name: `Category ${Date.now()}`, active: true },
    });

    await sut.execute(categoryRow.id);

    const deleted = await prisma.category.findUnique({ where: { id: categoryRow.id } });
    expect(deleted).toBeNull();
  });

  it('should return success message', async() => {
    const categoryRow = await prisma.category.create({
      data: { name: `Category ${Date.now()}`, active: true },
    });

    const result = await sut.execute(categoryRow.id);

    expect(result).toEqual({ message: 'Exclusão realizada com sucesso' });
  });
});
