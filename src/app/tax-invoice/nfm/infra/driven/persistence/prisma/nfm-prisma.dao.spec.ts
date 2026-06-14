import { Test } from '@nestjs/testing';
import { NfmStatus } from 'src/app/tax-invoice/nfm/domain/enums/nfm-status.enum';
import { NfmPersistenceModule } from 'src/app/tax-invoice/nfm/application/persistence/nfm-persistence.module';
import { SaveNfmData } from 'src/app/tax-invoice/nfm/application/usecases/save-elegible-nfms/dtos/save-elegible-nfms.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NfmDaoAdapterPrisma } from './nfm-prisma.dao';

function makeSaveNfmData(overrides: Partial<SaveNfmData> = {}): SaveNfmData {
  const now = new Date();
  return {
    clientId: 1,
    clientDocument: '00000000000101',
    companyName: 'Empresa Teste',
    status: NfmStatus.PENDING,
    referenceMonth: now.getMonth() + 1,
    referenceYear: now.getFullYear(),
    totalValueInCents: 10000,
    data: {
      client: { id: 1, document: '00000000000101', companyName: 'Empresa Teste' },
      clientInvoiceConfig: { clientId: 1 },
      clientItems: [{ totalValueInCents: 10000 }],
    } as SaveNfmData['data'],
    ...overrides,
  };
}

describe('NfmDaoAdapterPrisma', () => {
  let sut: NfmDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        NfmPersistenceModule,
        ConfigModule,
      ],
      providers: [
        NfmDaoAdapterPrisma,
      ],
    }).compile();

    sut = module.get(NfmDaoAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.nfm.deleteMany();
  });

  afterAll(async() => {
    await prisma.nfm.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('saveMany', () => {
    it('should return 0 when rows array is empty', async() => {
      // Act
      const count = await sut.saveMany([]);

      // Assert
      expect(count).toBe(0);
    });

    it('should persist rows and return count', async() => {
      // Arrange
      const row = makeSaveNfmData();

      // Act
      const count = await sut.saveMany([row]);

      // Assert
      expect(count).toBe(1);
      expect(await prisma.nfm.count()).toBe(1);
    });

    it('should skip duplicates with skipDuplicates', async() => {
      // Arrange
      const row = makeSaveNfmData();

      // Act
      const first = await sut.saveMany([row]);
      const second = await sut.saveMany([row]);

      // Assert
      expect(first).toBe(1);
      expect(second).toBe(0);
      expect(await prisma.nfm.count()).toBe(1);
    });
  });
});
