import { Test } from '@nestjs/testing';
import { NfmStatus } from 'src/app/tax-invoice/nfm/domain/enums/nfm-status.enum';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NfmModule } from '../../../nfm.module';
import { InvalidNfmDateRangeError } from '../../../domain/errors/invalid-nfm-date-range.error';
import { FindGeneratedNfms } from './find-generated-nfms.service';

describe('FindGeneratedNfms - Integration tests', () => {
  let sut: FindGeneratedNfms;
  let prisma: PrismaService;
  let cnaeNbsIndopId: number;
  let cnaeNbsIndopId2: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [NfmModule],
    }).compile();

    sut = module.get(FindGeneratedNfms);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const suffix = String(Date.now()).slice(-8);
    const cnae = await prisma.cnae.create({
      data: { code: `C${suffix}`, description: 'CNAE FindGenerated' },
    });
    const nbs = await prisma.nbs.create({
      data: { code: `N${suffix}`, description: 'NBS FindGenerated' },
    });
    const indop = await prisma.indop.create({
      data: { code: `I${suffix}`, description: 'INDOP FindGenerated' },
    });
    const indop2 = await prisma.indop.create({
      data: { code: `J${suffix}`, description: 'INDOP2 FindGenerated' },
    });

    const corr1 = await prisma.cnaeNbsIndop.create({
      data: {
        cnaeId: cnae.id,
        nbsId: nbs.id,
        indopId: indop.id,
        serviceListItemCode: '01.07',
      },
    });
    const corr2 = await prisma.cnaeNbsIndop.create({
      data: {
        cnaeId: cnae.id,
        nbsId: nbs.id,
        indopId: indop2.id,
        serviceListItemCode: '01.07',
      },
    });
    cnaeNbsIndopId = corr1.id;
    cnaeNbsIndopId2 = corr2.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  async function createNfse(rpsNumber: number) {
    return prisma.nfse.create({
      data: {
        companyId: 1,
        clientId: 1,
        rpsNumber,
        rpsSeries: 'NFSE',
        status: NfseStatus.PENDING,
        data: { providerDocument: '12345678000199' },
      },
    });
  }

  async function createNfm(opts: {
    clientId: number;
    nfseId?: number | null;
    cnaeNbsIndopId: number;
    createdAt?: Date;
  }) {
    const nfm = await prisma.nfm.create({
      data: {
        clientId: opts.clientId,
        clientDocument: '00000000000101',
        companyName: 'Empresa Teste',
        status: NfmStatus.PENDING,
        referenceMonth: 8,
        referenceYear: 2026,
        totalValueInCents: 10000,
        cnaeNbsIndopId: opts.cnaeNbsIndopId,
        nfseId: opts.nfseId ?? null,
        data: { client: { id: opts.clientId } },
      },
    });

    if (opts.createdAt) {
      await prisma.nfm.update({
        where: { id: nfm.id },
        data: { createdAt: opts.createdAt },
      });
    }

    return nfm;
  }

  it('should exclude nfms without nfseId', async() => {
    // Arrange
    await createNfm({ clientId: 1, cnaeNbsIndopId });
    const nfse = await createNfse(1);
    const linked = await createNfm({
      clientId: 2,
      nfseId: nfse.id,
      cnaeNbsIndopId: cnaeNbsIndopId2,
    });

    // Act
    const result = await sut.execute({});

    // Assert
    expect(result.totalItems).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe(linked.id);
    expect(result.data[0].nfse.id).toBe(nfse.id);
  });

  it('should filter by dateStart and dateEnd', async() => {
    // Arrange
    const nfseIn = await createNfse(10);
    const nfseOut = await createNfse(11);
    const inRange = await createNfm({
      clientId: 10,
      nfseId: nfseIn.id,
      cnaeNbsIndopId,
      createdAt: new Date('2026-08-15T12:00:00.000Z'),
    });
    await createNfm({
      clientId: 11,
      nfseId: nfseOut.id,
      cnaeNbsIndopId: cnaeNbsIndopId2,
      createdAt: new Date('2026-07-01T12:00:00.000Z'),
    });

    // Act
    const result = await sut.execute({
      dateStart: '2026-08-01',
      dateEnd: '2026-08-31',
    });

    // Assert
    expect(result.totalItems).toBe(1);
    expect(result.data[0].id).toBe(inRange.id);
  });

  it('should throw when dateStart is after dateEnd', async() => {
    await expect(sut.execute({
      dateStart: '2026-08-31',
      dateEnd: '2026-08-01',
    })).rejects.toThrow(InvalidNfmDateRangeError);
  });
});
