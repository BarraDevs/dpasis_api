import { buildMinimalResaleData, nextResaleFixtureId } from 'src/test/fixtures/minimal-resale';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { ClientInvoiceType } from 'src/app/client/client/domain/enums/client-invoice-type.enum';
import { ClientType } from 'src/app/client/client/domain/enums/client-type.enum';
import { HonorificInUseError } from 'src/app/global/honorific/domain/errors/honorific-in-use.error';
import { HonorificNotFoundError } from 'src/app/global/honorific/domain/errors/honorific-not-found.error';
import { HonorificModule } from 'src/app/global/honorific/honorific.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { DeleteHonorific } from './delete-honorific.service';

describe('DeleteHonorific - Integration tests', () => {
  let sut: DeleteHonorific;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [HonorificModule],
    }).compile();

    sut = module.get(DeleteHonorific);
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

  it('should delete honorific', async() => {
    const row = await prisma.honorific.create({ data: { name: 'Sr.' } });

    await sut.execute(row.id);

    const gone = await prisma.honorific.findUnique({ where: { id: row.id } });
    expect(gone).toBeNull();
  });

  it('should throw HonorificInUseError when client references honorific', async() => {
    const honorific = await prisma.honorific.create({
      data: { name: `Vinc-${Date.now()}` },
    });

    const [group, resale, company] = await Promise.all([
      prisma.clientGroup.create({ data: { name: `G-${Date.now()}`, active: true } }),
      prisma.resale.create({ data: buildMinimalResaleData(nextResaleFixtureId()) }),
      prisma.company.create({ data: buildMinimalCompanyData() }),
    ]);

    await prisma.client.create({
      data: {
        id: 1,
        type: ClientType.PJ,
        document: '09748165000110',
        groupId: group.id,
        resaleId: resale.id,
        companyId: company.id,
        honorificId: honorific.id,
        companyName: 'Empresa X',
        headquarters: 'SP',
        invoiceType: ClientInvoiceType.CONTRACT,
        generateInvoice: true,
        active: true,
      },
    });

    await expect(sut.execute(honorific.id)).rejects.toThrow(HonorificInUseError);
  });

  it('should throw HonorificInUseError when resale references honorific', async() => {
    const honorific = await prisma.honorific.create({
      data: { name: `Rev-${Date.now()}` },
    });

    await prisma.resale.create({
      data: {
        ...buildMinimalResaleData(nextResaleFixtureId()),
        honorificId: honorific.id,
      } as Prisma.ResaleUncheckedCreateInput,
    });

    await expect(sut.execute(honorific.id)).rejects.toThrow(HonorificInUseError);
  });

  it('should throw when not found', async() => {
    await expect(sut.execute(99999)).rejects.toThrow(HonorificNotFoundError);
  });
});
