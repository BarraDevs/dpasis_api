import { Test } from '@nestjs/testing';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ClientSequenceRepositoryAdapterPrisma } from './client-sequence-prisma.repository';

describe('ClientSequenceRepositoryAdapterPrisma - Integration tests', () => {
  let sut: ClientSequenceRepositoryAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ClientSequenceRepositoryAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(ClientSequenceRepositoryAdapterPrisma);
    prisma = module.get(PrismaService);
  });

  async function upsertSequence(nextId: number) {
    await prisma.clientSequence.upsert({
      where: { id: 1 },
      create: { id: 1, nextId },
      update: { nextId },
    });
  }

  beforeEach(async() => {
    await prisma.truncate();
    await upsertSequence(1);
  });

  afterAll(async() => {
    await prisma.truncate();
    await upsertSequence(1);
    await prisma.$disconnect();
  });

  describe('getCurrent', () => {
    it('should return nextId from the singleton row', async() => {
      await upsertSequence(42);

      const result = await sut.getCurrent();

      expect(result).toBe(42);
    });
  });

  describe('getAndIncrement', () => {
    it('should return the previous next_id and persist next_id + 1', async() => {
      await upsertSequence(10);

      const first = await sut.getAndIncrement();

      expect(first).toBe(10);

      const rowAfterFirst = await prisma.clientSequence.findUniqueOrThrow({ where: { id: 1 } });
      expect(rowAfterFirst.nextId).toBe(11);

      const second = await sut.getAndIncrement();

      expect(second).toBe(11);

      const rowAfterSecond = await prisma.clientSequence.findUniqueOrThrow({ where: { id: 1 } });
      expect(rowAfterSecond.nextId).toBe(12);
    });
  });

  describe('setNextId', () => {
    it('should persist the given nextId', async() => {
      await sut.setNextId(500);

      const row = await prisma.clientSequence.findUniqueOrThrow({ where: { id: 1 } });
      expect(row.nextId).toBe(500);

      expect(await sut.getCurrent()).toBe(500);
    });
  });

  describe('ensureNextIdIsAtLeast', () => {
    it('should raise nextId when it is strictly less than minValue', async() => {
      await upsertSequence(20);

      await sut.ensureNextIdIsAtLeast(100);

      const row = await prisma.clientSequence.findUniqueOrThrow({ where: { id: 1 } });
      expect(row.nextId).toBe(100);
    });

    it('should not change nextId when it is already greater than or equal to minValue', async() => {
      await upsertSequence(200);

      await sut.ensureNextIdIsAtLeast(50);

      const row = await prisma.clientSequence.findUniqueOrThrow({ where: { id: 1 } });
      expect(row.nextId).toBe(200);
    });

    it('should not change nextId when it equals minValue', async() => {
      await upsertSequence(75);

      await sut.ensureNextIdIsAtLeast(75);

      const row = await prisma.clientSequence.findUniqueOrThrow({ where: { id: 1 } });
      expect(row.nextId).toBe(75);
    });
  });
});
