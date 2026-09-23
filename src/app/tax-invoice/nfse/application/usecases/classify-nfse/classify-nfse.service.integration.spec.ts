import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NfseClassificationKind } from '../../../domain/enums/nfse-classification-kind.enum';
import { DuplicateNfseClassificationError } from '../../../domain/errors/duplicate-nfse-classification.error';
import { NfseModule } from '../../../nfse.module';
import { ClassifyNfse } from './classify-nfse.service';

describe('ClassifyNfse - Integration tests', () => {
  let sut: ClassifyNfse;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [NfseModule],
    }).compile();

    sut = module.get(ClassifyNfse);
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

  it('should persist classifications without writing nfse or nfm rows', async() => {
    // Act
    const result = await sut.execute({
      companyId: 10,
      items: [
        { rpsNumber: 41, rpsSeries: 'nfse', kind: NfseClassificationKind.NFM },
        { rpsNumber: 42, rpsSeries: 'A', kind: NfseClassificationKind.NFS },
      ],
    });

    // Assert
    expect(result).toEqual({ message: 'NFS-e classificadas com sucesso' });
    const rows = await prisma.nfseClassification.findMany({ orderBy: { rpsNumber: 'asc' } });
    expect(rows).toEqual([
      expect.objectContaining({
        companyId: 10,
        rpsNumber: 41,
        rpsSeries: 'NFSE',
        kind: NfseClassificationKind.NFM,
      }),
      expect.objectContaining({
        companyId: 10,
        rpsNumber: 42,
        rpsSeries: 'A',
        kind: NfseClassificationKind.NFS,
      }),
    ]);
    expect(await prisma.nfse.count()).toBe(0);
    expect(await prisma.nfm.count()).toBe(0);
  });

  it('should reclassify an existing RPS', async() => {
    // Arrange
    await sut.execute({
      companyId: 10,
      items: [{ rpsNumber: 41, rpsSeries: 'NFSE', kind: NfseClassificationKind.NFM }],
    });

    // Act
    await sut.execute({
      companyId: 10,
      items: [{ rpsNumber: 41, rpsSeries: 'NFSE', kind: NfseClassificationKind.NFS }],
    });

    // Assert
    const rows = await prisma.nfseClassification.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe(NfseClassificationKind.NFS);
  });

  it('should throw DuplicateNfseClassificationError when the payload repeats an RPS', async() => {
    // Act & Assert
    await expect(sut.execute({
      companyId: 10,
      items: [
        { rpsNumber: 41, rpsSeries: 'NFSE', kind: NfseClassificationKind.NFM },
        { rpsNumber: 41, rpsSeries: 'NFSE', kind: NfseClassificationKind.NFS },
      ],
    })).rejects.toThrow(DuplicateNfseClassificationError);
    expect(await prisma.nfseClassification.count()).toBe(0);
  });
});
