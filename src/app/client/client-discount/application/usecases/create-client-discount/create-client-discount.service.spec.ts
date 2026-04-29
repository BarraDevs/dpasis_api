import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { Test } from '@nestjs/testing';
import { ClientDiscountModule } from 'src/app/client/client-discount/client-discount.module';
import { DiscountType } from 'src/app/client/client-discount/domain/enums/discount-type.enum';
import { InvalidDiscountValueError } from 'src/app/client/client-discount/domain/value-objects/discount-value/discount-value.error';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { ClientNotFoundError } from 'src/app/client/client/domain/errors/client-not-found.error';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateClientDiscount } from './create-client-discount.service';
import { CreateClientDiscountInputDto } from './dtos/create-client-discount.dto';

function makeValidInput(overrides?: Record<string, unknown>): CreateClientDiscountInputDto {
  return {
    clientId: 0,
    description: 'Desconto de teste',
    type: DiscountType.PERCENTAGE,
    discountValue: 1050,
    month: 3,
    year: 2026,
    doNotGenerateCharge: false,
    terminateContract: false,
    ...overrides,
  };
}

describe('CreateClientDiscount', () => {
  let sut: CreateClientDiscount;
  let prisma: PrismaService;
  let clientId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ClientDiscountModule],
    }).compile();

    sut = module.get(CreateClientDiscount);
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

  it('should create client discount and return id', async() => {
    const input = makeValidInput({
      clientId,
      description: 'Desconto 10%',
      type: DiscountType.PERCENTAGE,
      discountValue: 1000,
    });

    const result = await sut.execute(input);

    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');

    const saved = await prisma.clientDiscount.findUnique({ where: { id: result.id } });
    expect(saved).not.toBeNull();
    expect(saved?.description).toBe('Desconto 10%');
    expect(saved?.discountValue).toBe(1000);
    expect(saved?.type).toBe(DiscountType.PERCENTAGE);
  });

  it('should throw ClientNotFoundError when client does not exist', async() => {
    const input = makeValidInput({ clientId: 99999 });

    await expect(sut.execute(input)).rejects.toThrow(ClientNotFoundError);
  });

  it('should throw InvalidDiscountValueError when percentage exceeds 10000', async() => {
    const input = makeValidInput({
      clientId,
      type: DiscountType.PERCENTAGE,
      discountValue: 10001,
    });

    await expect(sut.execute(input)).rejects.toThrow(InvalidDiscountValueError);
  });

  it('should create monetary discount', async() => {
    const input = makeValidInput({
      clientId,
      type: DiscountType.MONETARY,
      discountValue: 5000,
      description: 'R$ 50,00 de desconto',
    });

    const result = await sut.execute(input);

    const saved = await prisma.clientDiscount.findUnique({ where: { id: result.id } });
    expect(saved?.discountValue).toBe(5000);
    expect(saved?.type).toBe(DiscountType.MONETARY);
  });

  it('should create discount with doNotGenerateCharge and terminateContract true', async() => {
    const input = makeValidInput({
      clientId,
      doNotGenerateCharge: true,
      terminateContract: true,
    });

    const result = await sut.execute(input);

    const saved = await prisma.clientDiscount.findUnique({ where: { id: result.id } });
    expect(saved?.doNotGenerateCharge).toBe(true);
    expect(saved?.terminateContract).toBe(true);
  });

  it('should throw InvalidDiscountValueError when percentage value is negative', async() => {
    const input = makeValidInput({
      clientId,
      type: DiscountType.PERCENTAGE,
      discountValue: -1,
    });

    await expect(sut.execute(input)).rejects.toThrow(InvalidDiscountValueError);
  });

  it('should throw InvalidDiscountValueError when monetary value is negative', async() => {
    const input = makeValidInput({
      clientId,
      type: DiscountType.MONETARY,
      discountValue: -1,
    });

    await expect(sut.execute(input)).rejects.toThrow(InvalidDiscountValueError);
  });
});
