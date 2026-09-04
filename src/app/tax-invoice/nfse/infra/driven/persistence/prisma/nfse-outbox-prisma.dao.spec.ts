import { Test } from '@nestjs/testing';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { NfseOutboxDaoAdapterPrisma } from './nfse-outbox-prisma.dao';

let counter = 0;

async function seedNfse(prisma: PrismaService) {
  counter += 1;
  return prisma.nfse.create({
    data: {
      companyId: 1,
      clientId: 1,
      rpsNumber: (Date.now() % 100_000) + counter,
      rpsSeries: 'NFSE',
      status: NfseStatus.PENDING,
      data: {},
    },
  });
}

describe('NfseOutboxDaoAdapterPrisma - Integration tests', () => {
  let sut: NfseOutboxDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [NfseOutboxDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(NfseOutboxDaoAdapterPrisma);
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

  it('should return rows never dispatched and older than the threshold', async() => {
    // Arrange
    const nfse = await seedNfse(prisma);
    const row = await prisma.nfseOutbox.create({
      data: {
        nfseId: nfse.id,
        jobName: JobName.IssueNfseBatch,
        payload: { nfseId: nfse.id },
        availableAt: new Date(Date.now() - 120_000),
      },
    });

    // Act
    const result = await sut.findUndispatched(60, 200);

    // Assert
    expect(result).toEqual([
      { id: row.id, nfseId: nfse.id, jobName: JobName.IssueNfseBatch, payload: { nfseId: nfse.id } },
    ]);
  });

  it('should ignore rows already dispatched', async() => {
    // Arrange
    const nfse = await seedNfse(prisma);
    await prisma.nfseOutbox.create({
      data: {
        nfseId: nfse.id,
        jobName: JobName.IssueNfseBatch,
        payload: { nfseId: nfse.id },
        availableAt: new Date(Date.now() - 120_000),
        dispatchedAt: new Date(),
      },
    });

    // Act
    const result = await sut.findUndispatched(60, 200);

    // Assert
    expect(result).toEqual([]);
  });

  it('should ignore rows still inside the grace window', async() => {
    // Arrange — o despacho normal acontece milissegundos depois do commit.
    const nfse = await seedNfse(prisma);
    await prisma.nfseOutbox.create({
      data: { nfseId: nfse.id, jobName: JobName.IssueNfseBatch, payload: { nfseId: nfse.id } },
    });

    // Act
    const result = await sut.findUndispatched(60, 200);

    // Assert
    expect(result).toEqual([]);
  });

  it('should return the oldest first and respect the limit', async() => {
    // Arrange
    const nfse = await seedNfse(prisma);
    const older = await prisma.nfseOutbox.create({
      data: {
        nfseId: nfse.id,
        jobName: JobName.IssueNfseBatch,
        payload: { nfseId: nfse.id },
        availableAt: new Date(Date.now() - 600_000),
      },
    });
    await prisma.nfseOutbox.create({
      data: {
        nfseId: nfse.id,
        jobName: JobName.PollNfseBatch,
        payload: { nfseId: nfse.id },
        availableAt: new Date(Date.now() - 120_000),
      },
    });

    // Act
    const result = await sut.findUndispatched(60, 1);

    // Assert
    expect(result.map((r) => r.id)).toEqual([older.id]);
  });
});
