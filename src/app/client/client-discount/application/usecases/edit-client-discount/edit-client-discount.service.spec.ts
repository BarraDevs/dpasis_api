import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ClientDiscountModule } from 'src/app/client/client-discount/client-discount.module';
import { DiscountType } from 'src/app/client/client-discount/domain/enums/discount-type.enum';
import { ClientDiscountNotFoundError } from 'src/app/client/client-discount/domain/errors/client-discount-not-found.error';
import { InvalidDiscountValueError } from 'src/app/client/client-discount/domain/value-objects/discount-value/discount-value.error';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientDiscountDto } from '../../dtos/client-discount.dto';
import { EditClientDiscount } from './edit-client-discount.service';

describe('EditClientDiscount', () => {
  let sut: EditClientDiscount;
  let prisma: PrismaService;
  let clientId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDiscountModule],
    }).compile();

    sut = module.get(EditClientDiscount);
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
    const data = { description: 'Descrição nova' };

    await expect(sut.execute(99999, data)).rejects.toThrow(ClientDiscountNotFoundError);
    await expect(sut.execute(99999, data)).rejects.toThrow('Desconto não encontrado na base de dados.');
  });

  it('should edit discount and return success message', async() => {
    const created = await prisma.clientDiscount.create({
      data: {
        clientId,
        description: 'Desconto original',
        type: DiscountType.PERCENTAGE,
        discountValue: 500,
        month: 1,
        year: 2026,
        doNotGenerateCharge: false,
        terminateContract: false,
        active: true,
      },
    });

    const result = await sut.execute(created.id, {
      description: 'Desconto editado',
      discountValue: 1000,
    });

    expect(result).toEqual({ message: 'Edição realizada com sucesso' });

    const updated = await prisma.clientDiscount.findUnique({ where: { id: created.id } });
    expect(updated).toEqual<ClientDiscountDto>({
      ...created,
      type: DiscountType.PERCENTAGE,
      description: 'Desconto editado',
      discountValue: 1000,
      updatedAt: updated!.updatedAt,
    });
  });

  it('should edit only provided fields (partial update)', async() => {
    const created = await prisma.clientDiscount.create({
      data: {
        clientId,
        description: 'Desconto original',
        type: DiscountType.PERCENTAGE,
        discountValue: 1050,
        month: 3,
        year: 2026,
        doNotGenerateCharge: false,
        terminateContract: false,
        active: true,
      },
    });

    await sut.execute(created.id, { description: 'Descrição atualizada' });

    const updated = await prisma.clientDiscount.findUnique({ where: { id: created.id } });
    expect(updated).toEqual<ClientDiscountDto>({
      ...created,
      description: 'Descrição atualizada',
      type: DiscountType.PERCENTAGE,
      updatedAt: updated!.updatedAt,
    });
  });

  it('should edit all fields', async() => {
    const created = await prisma.clientDiscount.create({
      data: {
        clientId,
        description: 'Original',
        type: DiscountType.PERCENTAGE,
        discountValue: 500,
        month: 1,
        year: 2026,
        doNotGenerateCharge: false,
        terminateContract: false,
        active: true,
      },
    });

    await sut.execute(created.id, {
      description: 'Desconto monetário atualizado',
      type: DiscountType.MONETARY,
      discountValue: 15000,
      month: 12,
      year: 2025,
      doNotGenerateCharge: true,
      terminateContract: true,
    });

    const updated = await prisma.clientDiscount.findUnique({ where: { id: created.id } });
    expect(updated).toEqual<ClientDiscountDto>({
      ...created,
      description: 'Desconto monetário atualizado',
      type: DiscountType.MONETARY,
      discountValue: 15000,
      month: 12,
      year: 2025,
      doNotGenerateCharge: true,
      terminateContract: true,
      updatedAt: updated!.updatedAt,
    });
  });

  it('should throw InvalidDiscountValueError when percentage exceeds 10000', async() => {
    const created = await prisma.clientDiscount.create({
      data: {
        clientId,
        description: 'Original',
        type: DiscountType.PERCENTAGE,
        discountValue: 500,
        month: 1,
        year: 2026,
        doNotGenerateCharge: false,
        terminateContract: false,
        active: true,
      },
    });

    await expect(
      sut.execute(created.id, {
        discountValue: 10001,
        type: DiscountType.PERCENTAGE,
      }),
    ).rejects.toThrow(InvalidDiscountValueError);
  });

  it('should throw InvalidDiscountValueError when monetary value is negative', async() => {
    const created = await prisma.clientDiscount.create({
      data: {
        clientId,
        description: 'Original',
        type: DiscountType.MONETARY,
        discountValue: 5000,
        month: 1,
        year: 2026,
        doNotGenerateCharge: false,
        terminateContract: false,
        active: true,
      },
    });

    await expect(
      sut.execute(created.id, {
        discountValue: -1,
        type: DiscountType.MONETARY,
      }),
    ).rejects.toThrow(InvalidDiscountValueError);
  });
});
