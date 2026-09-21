import { Test } from '@nestjs/testing';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NfmModule } from '../../../nfm.module';
import { NfmNfseMissingError } from '../../../domain/errors/nfm-nfse-missing.error';
import { NfmNotFoundError } from '../../../domain/errors/nfm-not-found.error';
import { FindNfmById } from './find-nfm-by-id.service';

describe('FindNfmById - Integration tests', () => {
  let sut: FindNfmById;
  let prisma: PrismaService;
  let cnaeNbsIndopId: number;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [NfmModule],
    }).compile();

    sut = module.get(FindNfmById);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();

    const suffix = String(Date.now()).slice(-8);
    const cnae = await prisma.cnae.create({
      data: { code: `C${suffix}`, description: 'CNAE FindNfmById' },
    });
    const nbs = await prisma.nbs.create({
      data: { code: `N${suffix}`, description: 'NBS FindNfmById' },
    });
    const indop = await prisma.indop.create({
      data: { code: `I${suffix}`, description: 'INDOP FindNfmById' },
    });

    const corr = await prisma.cnaeNbsIndop.create({
      data: {
        cnaeId: cnae.id,
        nbsId: nbs.id,
        indopId: indop.id,
        serviceListItemCode: '01.07',
      },
    });
    cnaeNbsIndopId = corr.id;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw NfmNotFoundError when the nfm does not exist', async() => {
    await expect(sut.execute(999_999)).rejects.toThrow(NfmNotFoundError);
  });

  it('should throw NfmNfseMissingError when nfm has no linked nfse', async() => {
    const nfm = await prisma.nfm.create({
      data: {
        clientId: 1,
        clientDocument: '00000000000101',
        companyName: 'Empresa Teste',
        referenceMonth: 8,
        referenceYear: 2026,
        totalValueInCents: 10000,
        cnaeNbsIndopId,
        nfseId: null,
        data: { client: { id: 1 } },
      },
    });

    await expect(sut.execute(nfm.id)).rejects.toThrow(NfmNfseMissingError);
  });

  it('should return the nfm when it exists with linked nfse', async() => {
    // Arrange
    const nfse = await prisma.nfse.create({
      data: {
        companyId: 1,
        clientId: 1,
        rpsNumber: Date.now() % 100_000,
        rpsSeries: 'NFSE',
        status: NfseStatus.PENDING,
        data: { providerDocument: '12345678000199' },
      },
    });

    const nfm = await prisma.nfm.create({
      data: {
        clientId: 1,
        clientDocument: '00000000000101',
        companyName: 'Empresa Teste',
        referenceMonth: 8,
        referenceYear: 2026,
        totalValueInCents: 10000,
        cnaeNbsIndopId,
        nfseId: nfse.id,
        data: { client: { id: 1 } },
      },
    });

    // Act
    const result = await sut.execute(nfm.id);

    // Assert
    expect(result).toMatchObject({
      id: nfm.id,
      clientId: 1,
      clientDocument: '00000000000101',
      companyName: 'Empresa Teste',
      clientItems: [],
      nfse: { id: nfse.id },
    });
  });

  it('should return clientItems from the nfm data snapshot', async() => {
    // Arrange
    const snapshotItems = [
      { totalValueInCents: 10000, description: 'Item snapshot' },
    ];
    const nfse = await prisma.nfse.create({
      data: {
        companyId: 1,
        clientId: 1,
        rpsNumber: Date.now() % 100_000,
        rpsSeries: 'NFSE',
        status: NfseStatus.PENDING,
        data: { providerDocument: '12345678000199' },
      },
    });

    const nfm = await prisma.nfm.create({
      data: {
        clientId: 1,
        clientDocument: '00000000000101',
        companyName: 'Empresa Teste',
        referenceMonth: 8,
        referenceYear: 2026,
        totalValueInCents: 10000,
        cnaeNbsIndopId,
        nfseId: nfse.id,
        data: { client: { id: 1 }, clientItems: snapshotItems },
      },
    });

    // Act
    const result = await sut.execute(nfm.id);

    // Assert
    expect(result.clientItems).toEqual(snapshotItems);
  });
});
