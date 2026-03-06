import { Test } from '@nestjs/testing';
import { ClientDiscountModule } from 'src/app/client/client-discount/client-discount.module';
import { DiscountType } from 'src/app/client/client-discount/domain/enums/discount-type.enum';
import { ClientDiscountNotFoundError } from 'src/app/client/client-discount/domain/errors/client-discount-not-found.error';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FindClientDiscountById } from './find-client-discount-by-id.service';

describe('FindClientDiscountById', () => {
  let sut: FindClientDiscountById;
  let prisma: PrismaService;
  let clientId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDiscountModule],
    }).compile();

    sut = module.get(FindClientDiscountById);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const [group, owner] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `Grupo ${Date.now()}`, active: true } }),
      prisma.clientOwner.create({ data: { name: `Owner ${Date.now()}`, active: true } }),
    ]);

    const client = await prisma.client.create({
      data: {
        type: ClientType.PJ,
        document: '09748165000110',
        ie: null,
        groupId: group.id,
        ownerId: owner.id,
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

  it('should return ClientDiscountDto when discount exists', async() => {
    const created = await prisma.clientDiscount.create({
      data: {
        clientId,
        description: 'Desconto de teste',
        type: DiscountType.PERCENTAGE,
        discountValue: 1050,
        month: 3,
        year: 2026,
        doNotGenerateCharge: false,
        terminateContract: false,
      },
    });

    const result = await sut.execute(created.id);

    expect(result).toEqual({
      id: created.id,
      clientId,
      description: 'Desconto de teste',
      type: DiscountType.PERCENTAGE,
      discountValue: 1050,
      month: 3,
      year: 2026,
      doNotGenerateCharge: false,
      terminateContract: false,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  });

  it('should return MONETARY type discount with all fields', async() => {
    const created = await prisma.clientDiscount.create({
      data: {
        clientId,
        description: 'Desconto R$ 50',
        type: DiscountType.MONETARY,
        discountValue: 5000,
        month: 6,
        year: 2025,
        doNotGenerateCharge: true,
        terminateContract: true,
      },
    });

    const result = await sut.execute(created.id);

    expect(result.id).toBe(created.id);
    expect(result.clientId).toBe(clientId);
    expect(result.description).toBe('Desconto R$ 50');
    expect(result.type).toBe(DiscountType.MONETARY);
    expect(result.discountValue).toBe(5000);
    expect(result.month).toBe(6);
    expect(result.year).toBe(2025);
    expect(result.doNotGenerateCharge).toBe(true);
    expect(result.terminateContract).toBe(true);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });
});
