import { Test } from '@nestjs/testing';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NfseRpsSequenceRepositoryAdapterPrisma } from './nfse-rps-sequence-prisma.repository';

describe('NfseRpsSequenceRepositoryAdapterPrisma - Integration tests', () => {
  let sut: NfseRpsSequenceRepositoryAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [NfseRpsSequenceRepositoryAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(NfseRpsSequenceRepositoryAdapterPrisma);
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

  describe('getAndIncrement', () => {
    it('should return 1 on the first call for a company', async() => {
      // Arrange
      const companyId = Date.now() % 100_000;

      // Act
      const result = await sut.getAndIncrement(companyId);

      // Assert
      expect(result).toBe(1);

      const row = await prisma.nfseRpsSequence.findUnique({ where: { companyId } });
      expect(row?.nextId).toBe(2);
    });

    it('should return sequential values on consecutive calls', async() => {
      // Arrange
      const companyId = Date.now() % 100_000;

      // Act
      const first = await sut.getAndIncrement(companyId);
      const second = await sut.getAndIncrement(companyId);
      const third = await sut.getAndIncrement(companyId);

      // Assert
      expect(first).toBe(1);
      expect(second).toBe(2);
      expect(third).toBe(3);

      const row = await prisma.nfseRpsSequence.findUnique({ where: { companyId } });
      expect(row?.nextId).toBe(4);
    });

    it('should keep independent sequences per company', async() => {
      // Arrange
      const companyA = Date.now() % 100_000;
      const companyB = companyA + 1;

      // Act
      const firstA = await sut.getAndIncrement(companyA);
      const firstB = await sut.getAndIncrement(companyB);
      const secondA = await sut.getAndIncrement(companyA);

      // Assert
      expect(firstA).toBe(1);
      expect(firstB).toBe(1);
      expect(secondA).toBe(2);
    });
  });
});
