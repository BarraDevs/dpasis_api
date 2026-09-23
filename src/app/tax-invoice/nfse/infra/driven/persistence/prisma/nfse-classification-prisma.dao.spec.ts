import { Test } from '@nestjs/testing';
import { NfseClassificationKind } from 'src/app/tax-invoice/nfse/domain/enums/nfse-classification-kind.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NfseClassificationDaoAdapterPrisma } from './nfse-classification-prisma.dao';

describe('NfseClassificationDaoAdapterPrisma - Integration tests', () => {
  let sut: NfseClassificationDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [NfseClassificationDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(NfseClassificationDaoAdapterPrisma);
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

  describe('upsertMany', () => {
    it('should insert rows and normalize series', async() => {
      // Act
      await sut.upsertMany(10, [
        { rpsNumber: 41, rpsSeries: ' nfse ', kind: NfseClassificationKind.NFM },
      ]);

      // Assert
      const row = await prisma.nfseClassification.findFirst();
      expect(row).toMatchObject({
        companyId: 10,
        rpsNumber: 41,
        rpsSeries: 'NFSE',
        kind: NfseClassificationKind.NFM,
      });
    });

    it('should update kind on the unique key', async() => {
      // Arrange
      await sut.upsertMany(10, [
        { rpsNumber: 41, rpsSeries: 'NFSE', kind: NfseClassificationKind.NFM },
      ]);

      // Act
      await sut.upsertMany(10, [
        { rpsNumber: 41, rpsSeries: 'nfse', kind: NfseClassificationKind.NFS },
      ]);

      // Assert
      const rows = await prisma.nfseClassification.findMany();
      expect(rows).toHaveLength(1);
      expect(rows[0].kind).toBe(NfseClassificationKind.NFS);
    });
  });

  describe('findByRpsKeys', () => {
    it('should return an empty array when keys are empty', async() => {
      // Act
      const result = await sut.findByRpsKeys(10, []);

      // Assert
      expect(result).toEqual([]);
    });

    it('should match series case-insensitively and ignore other companies', async() => {
      // Arrange
      await sut.upsertMany(10, [
        { rpsNumber: 41, rpsSeries: 'NFSE', kind: NfseClassificationKind.NFM },
        { rpsNumber: 42, rpsSeries: 'A', kind: NfseClassificationKind.NFS },
      ]);
      await sut.upsertMany(11, [
        { rpsNumber: 41, rpsSeries: 'NFSE', kind: NfseClassificationKind.NFS },
      ]);

      // Act
      const result = await sut.findByRpsKeys(10, [
        { rpsNumber: 41, rpsSeries: 'nfse' },
        { rpsNumber: 99, rpsSeries: 'NFSE' },
      ]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        companyId: 10,
        rpsNumber: 41,
        rpsSeries: 'NFSE',
        kind: NfseClassificationKind.NFM,
      });
    });
  });
});
