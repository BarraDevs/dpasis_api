import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ClientDiscountModule } from 'src/app/client/client-discount/client-discount.module';
import { DiscountType } from 'src/app/client/client-discount/domain/enums/discount-type.enum';
import { ClientDiscountNotFoundError } from 'src/app/client/client-discount/domain/errors/client-discount-not-found.error';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeleteClientDiscount } from './delete-client-discount.service';

describe('DeleteClientDiscount', () => {
  let sut: DeleteClientDiscount;
  let prisma: PrismaService;
  let clientId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDiscountModule],
    }).compile();

    sut = module.get(DeleteClientDiscount);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

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
        generateInvoice: true,
        active: true,
      },
    });

    clientId = client.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw ClientDiscountNotFoundError when discount does not exist', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(ClientDiscountNotFoundError);
    await expect(sut.execute(99999)).rejects.toThrow('Desconto não encontrado na base de dados.');
  });

  it('should delete discount and return success message', async() => {
    const created = await prisma.clientDiscount.create({
      data: {
        clientId,
        description: 'Desconto para deletar',
        type: DiscountType.PERCENTAGE,
        discountValue: 500,
        month: 3,
        year: 2026,
        doNotGenerateCharge: false,
        terminateContract: false,
        active: true,
      },
    });

    const result = await sut.execute(created.id);

    expect(result).toEqual({ message: 'Exclusão realizada com sucesso' });

    const deleted = await prisma.clientDiscount.findUnique({ where: { id: created.id } });
    expect(deleted).toBeNull();
  });

  it('should delete PERCENTAGE type discount', async() => {
    const created = await prisma.clientDiscount.create({
      data: {
        clientId,
        description: 'Desconto percentual',
        type: DiscountType.PERCENTAGE,
        discountValue: 1050,
        month: 1,
        year: 2026,
        doNotGenerateCharge: false,
        terminateContract: false,
        active: true,
      },
    });

    const result = await sut.execute(created.id);

    expect(result.message).toBe('Exclusão realizada com sucesso');
    const deleted = await prisma.clientDiscount.findUnique({ where: { id: created.id } });
    expect(deleted).toBeNull();
  });

  it('should delete MONETARY type discount', async() => {
    const created = await prisma.clientDiscount.create({
      data: {
        clientId,
        description: 'Desconto monetário',
        type: DiscountType.MONETARY,
        discountValue: 5000,
        month: 6,
        year: 2026,
        doNotGenerateCharge: true,
        terminateContract: true,
        active: true,
      },
    });

    const result = await sut.execute(created.id);

    expect(result.message).toBe('Exclusão realizada com sucesso');
    const deleted = await prisma.clientDiscount.findUnique({ where: { id: created.id } });
    expect(deleted).toBeNull();
  });
});
