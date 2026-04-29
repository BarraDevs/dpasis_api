import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { CnaeNbsIndopModule } from 'src/app/global/taxation/cnae-nbs-indop/cnae-nbs-indop.module';
import { CnaeNbsIndopInUseError } from 'src/app/global/taxation/cnae-nbs-indop/domain/errors/cnae-nbs-indop-in-use.error';
import { CnaeNbsIndopNotFoundError } from 'src/app/global/taxation/cnae-nbs-indop/domain/errors/cnae-nbs-indop-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeleteCnaeNbsIndop } from './delete-cnae-nbs-indop.service';

describe('DeleteCnaeNbsIndop - Integration tests', () => {
  let sut: DeleteCnaeNbsIndop;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CnaeNbsIndopModule],
    }).compile();

    sut = module.get(DeleteCnaeNbsIndop);
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

  it('should throw CnaeNbsIndopNotFoundError when combination does not exist', async() => {
    const id = 99999;

    await expect(sut.execute(id)).rejects.toThrow(CnaeNbsIndopNotFoundError);
  });

  it('should throw CnaeNbsIndopInUseError when combination has linked client items', async() => {
    const [cnae, nbs, indop] = await Promise.all([
      prisma.cnae.create({ data: { code: `CNAE${Date.now()}`, description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: `NBS${Date.now()}`, description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: `IND${Date.now()}`, description: 'INDOP Test', active: true } }),
    ]);
    const created = await prisma.cnaeNbsIndop.create({
      data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
    });

    const [group, resale] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
    ]);

    const client = await prisma.client.create({
      data: {
        id: 1,
        type: ClientType.PJ,
        document: '09748165000110',
        ie: null,
        groupId: group.id,
        resaleId: resale.id,
        companyName: 'Empresa Test',
        fantasyName: null,
        headquarters: 'São Paulo',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: false,
        active: true,
      },
    });

    await prisma.clientItem.create({
      data: {
        clientId: client.id,
        description: 'Item Test',
        quantity: 1,
        unitValueInCents: 1000,
        cnaeNbsIndopId: created.id,
        active: true,
      },
    });

    await expect(sut.execute(created.id)).rejects.toThrow(CnaeNbsIndopInUseError);
    await expect(sut.execute(created.id)).rejects.toThrow(
      'Não é possível excluir a combinação pois existem registros vinculados.',
    );

    const stillExists = await prisma.cnaeNbsIndop.findUnique({ where: { id: created.id } });
    expect(stillExists).not.toBeNull();
  });

  it('should throw CnaeNbsIndopInUseError when combination has linked catalog services', async() => {
    const [cnae, nbs, indop] = await Promise.all([
      prisma.cnae.create({ data: { code: `CNAE${Date.now()}`, description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: `NBS${Date.now()}`, description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: `IND${Date.now()}`, description: 'INDOP Test', active: true } }),
    ]);
    const created = await prisma.cnaeNbsIndop.create({
      data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
    });

    const category = await prisma.category.create({
      data: { name: `Cat ${Date.now()}`, active: true },
    });
    const [billed, deliveryTerm, freight, proposalValidity, warranty] = await Promise.all([
      prisma.billed.create({
        data: { description: `Billed ${Date.now()}`, isJunction: false, installmentDays: [10], active: true },
      }),
      prisma.deliveryTerm.create({ data: { name: `Term ${Date.now()}`, active: true } }),
      prisma.freight.create({ data: { name: `Freight ${Date.now()}`, active: true } }),
      prisma.proposalValidity.create({ data: { name: `Validity ${Date.now()}`, active: true } }),
      prisma.warranty.create({ data: { name: `Warranty ${Date.now()}`, active: true } }),
    ]);

    await prisma.service.create({
      data: {
        cnaeNbsIndopId: created.id,
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

    await expect(sut.execute(created.id)).rejects.toThrow(CnaeNbsIndopInUseError);
    await expect(sut.execute(created.id)).rejects.toThrow(
      'Não é possível excluir a combinação pois existem registros vinculados.',
    );

    const stillExists = await prisma.cnaeNbsIndop.findUnique({ where: { id: created.id } });
    expect(stillExists).not.toBeNull();
  });

  it('should delete record and return success message when combination exists', async() => {
    const [cnae, nbs, indop] = await Promise.all([
      prisma.cnae.create({ data: { code: `CNAE${Date.now()}`, description: 'CNAE Test', active: true } }),
      prisma.nbs.create({ data: { code: `NBS${Date.now()}`, description: 'NBS Test', active: true } }),
      prisma.indop.create({ data: { code: `IND${Date.now()}`, description: 'INDOP Test', active: true } }),
    ]);
    const created = await prisma.cnaeNbsIndop.create({
      data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id },
    });

    const result = await sut.execute(created.id);

    expect(result).toEqual({ message: 'Combinação excluída com sucesso.' });

    const found = await prisma.cnaeNbsIndop.findUnique({ where: { id: created.id } });
    expect(found).toBeNull();
  });
});
