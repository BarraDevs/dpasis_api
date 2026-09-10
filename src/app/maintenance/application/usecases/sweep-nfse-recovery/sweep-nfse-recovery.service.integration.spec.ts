import { Test } from '@nestjs/testing';
import { MaintenanceModule } from 'src/app/maintenance/maintenance.module';
import { NfseQueueFakeAdapterProducer } from 'src/app/tax-invoice/nfse/infra/driven/queue/fake/nfse-queue-fake.producer';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { TOKENS } from 'src/core/di/token';
import { CacheModule } from 'src/infra/cache/cache.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { LoggerModule } from 'src/infra/logger/logger.module';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { SweepNfseRecovery } from './sweep-nfse-recovery.service';

let counter = 0;

async function seedNfse(prisma: PrismaService, overrides: Record<string, unknown> = {}) {
  counter += 1;
  return prisma.nfse.create({
    data: {
      companyId: 1,
      clientId: 1,
      rpsNumber: (Date.now() % 100_000) + counter,
      rpsSeries: 'NFSE',
      status: NfseStatus.PENDING,
      data: {},
      ...overrides,
    },
  });
}

describe('SweepNfseRecovery - Integration tests', () => {
  let sut: SweepNfseRecovery;
  let prisma: PrismaService;
  let queueProducer: NfseQueueFakeAdapterProducer;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [
        LoggerModule,
        CacheModule.register(),
        MaintenanceModule.register(),
      ],
    }).compile();

    sut = module.get(SweepNfseRecovery);
    prisma = module.get(PrismaService);
    queueProducer = module.get(TOKENS.NfseQueueProducer);
  });

  beforeEach(async() => {
    await prisma.truncate();
    queueProducer.addedIssueBatchJobs.length = 0;
    queueProducer.addedPollBatchJobs.length = 0;
    queueProducer.addedIssueBankPaymentJobs.length = 0;
    queueProducer.addedReconcileNfseJobs.length = 0;
    queueProducer.addedConfirmBankPaymentJobs.length = 0;
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should re-enqueue an outbox row that was never dispatched and mark it', async() => {
    // Arrange — a NFS-e existe e o job nunca entrou no Redis.
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
    const count = await sut.sweepOutbox();

    // Assert
    expect(count).toBe(1);
    expect(queueProducer.addedIssueBatchJobs).toEqual([
      { name: JobName.IssueNfseBatch, data: { nfseId: nfse.id } },
    ]);
    const saved = await prisma.nfseOutbox.findUnique({ where: { id: row.id } });
    expect(saved?.dispatchedAt).toBeInstanceOf(Date);
  });

  it('should not re-enqueue a row already dispatched', async() => {
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
    const count = await sut.sweepOutbox();

    // Assert
    expect(count).toBe(0);
    expect(queueProducer.addedIssueBatchJobs).toHaveLength(0);
  });

  it('should enqueue a reconcile job for a note whose consultation is due', async() => {
    // Arrange
    const due = await seedNfse(prisma, {
      status: NfseStatus.AWAITING_PROVIDER,
      nextReconcileAt: new Date('2020-01-01T00:00:00Z'),
    });
    await seedNfse(prisma, {
      status: NfseStatus.AWAITING_PROVIDER,
      nextReconcileAt: new Date('2999-01-01T00:00:00Z'),
    });

    // Act
    const count = await sut.sweepReconciliation();

    // Assert
    expect(count).toBe(1);
    expect(queueProducer.addedReconcileNfseJobs).toEqual([
      { name: JobName.ReconcileNfse, data: { nfseId: due.id } },
    ]);
  });

  it('should enqueue the bank payment job for an issued note with no charge', async() => {
    // Arrange — é a janela entre `markIssued` e `addIssueBankPaymentJob`, que o outbox não cobre.
    const nfse = await seedNfse(prisma, { status: NfseStatus.ISSUED });
    await seedNfse(prisma, { status: NfseStatus.ISSUED, bankPaymentRequestCode: 'req-1' });

    // Act
    const count = await sut.sweepMissingBankPayment();

    // Assert
    expect(count).toBe(1);
    expect(queueProducer.addedIssueBankPaymentJobs).toEqual([
      { name: JobName.IssueNfseBankPayment, data: { nfseId: nfse.id } },
    ]);
  });

  it('should claim and enqueue a note whose bank payment retry is due, exactly once', async() => {
    // Arrange — a falha transitória deixou retentativa agendada; a outra nota ainda não venceu.
    const due = await seedNfse(prisma, {
      status: NfseStatus.ISSUED,
      bankPaymentFailedAt: new Date(Date.now() - 10 * 60_000),
      bankPaymentNextRetryAt: new Date(Date.now() - 60_000),
    });
    await seedNfse(prisma, {
      status: NfseStatus.ISSUED,
      bankPaymentFailedAt: new Date(),
      bankPaymentNextRetryAt: new Date(Date.now() + 60 * 60_000),
    });

    // Act — duas voltas seguidas: o lease tira a nota da segunda.
    const first = await sut.sweepBankPaymentRetry();
    const second = await sut.sweepBankPaymentRetry();

    // Assert
    expect(first).toBe(1);
    expect(second).toBe(0);
    expect(queueProducer.addedIssueBankPaymentJobs).toEqual([
      { name: JobName.IssueNfseBankPayment, data: { nfseId: due.id } },
    ]);
    const saved = await prisma.nfse.findUnique({ where: { id: due.id } });
    expect(saved?.bankPaymentRetryCount).toBe(1);
    expect(saved?.bankPaymentNextRetryAt?.getTime()).toBeGreaterThan(Date.now());
  });

  it('should enqueue a confirmation job for a charge requested long ago', async() => {
    // Arrange
    const nfse = await seedNfse(prisma, {
      status: NfseStatus.ISSUED,
      bankPaymentRequestCode: 'req-old',
      bankPaymentRequestedAt: new Date(Date.now() - 60 * 60_000),
    });
    await seedNfse(prisma, {
      status: NfseStatus.ISSUED,
      bankPaymentRequestCode: 'req-confirmed',
      bankPaymentRequestedAt: new Date(Date.now() - 60 * 60_000),
      bankPaymentConfirmedAt: new Date(),
    });

    // Act
    const count = await sut.sweepBankPaymentConfirmation();

    // Assert
    expect(count).toBe(1);
    expect(queueProducer.addedConfirmBankPaymentJobs).toEqual([
      { name: JobName.ConfirmNfseBankPayment, data: { nfseId: nfse.id } },
    ]);
  });
});
