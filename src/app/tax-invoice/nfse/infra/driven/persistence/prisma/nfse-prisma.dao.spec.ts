import { Test } from '@nestjs/testing';
import { NfseDto } from 'src/app/tax-invoice/nfse/application/dtos/nfse.dto';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NfseDaoAdapterPrisma } from './nfse-prisma.dao';

let rpsCounter = 0;

async function seedNfse(prisma: PrismaService, overrides: Record<string, unknown> = {}) {
  rpsCounter += 1;
  return prisma.nfse.create({
    data: {
      companyId: 1,
      clientId: 1,
      rpsNumber: (Date.now() % 100_000) + rpsCounter,
      rpsSeries: 'NFSE',
      status: NfseStatus.PENDING,
      data: { providerDocument: '12345678000199' },
      ...overrides,
    },
  });
}

describe('NfseDaoAdapterPrisma - Integration tests', () => {
  let sut: NfseDaoAdapterPrisma;
  let prisma: PrismaService;
  let seed: (overrides?: Record<string, unknown>)=> Promise<{ id: number; companyId: number; rpsNumber: number; rpsSeries: string }>;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [NfseDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(NfseDaoAdapterPrisma);
    prisma = module.get(PrismaService);
    seed = (overrides = {}) => seedNfse(prisma, overrides);
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

  describe('findById', () => {
    it('should return null when the nfse does not exist', async() => {
      // Act
      const result = await sut.findById(999_999);

      // Assert
      expect(result).toBeNull();
    });

    it('should return the nfse with the complete DTO shape', async() => {
      // Arrange
      const data = { providerDocument: '12345678000199', input: { service: { description: 'Serviço teste' } } };
      const row = await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: Date.now() % 100_000,
          rpsSeries: 'NFSE',
          status: NfseStatus.PENDING,
          data,
        },
      });

      // Act
      const result = await sut.findById(row.id);

      // Assert
      expect(result).toMatchObject<Partial<NfseDto>>({
        id: row.id,
        companyId: 1,
        clientId: 1,
        rpsNumber: row.rpsNumber,
        rpsSeries: 'NFSE',
        status: NfseStatus.PENDING,
        batchProtocol: null,
        nfseNumber: null,
        verificationCode: null,
        issuedAt: null,
        errorMessage: null,
        canceledAt: null,
        cancelReasonCode: null,
        bankPaymentProvider: null,
        bankPaymentRequestCode: null,
        data,
      });
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });

    it('should return canceled fields via findById after cancellation', async() => {
      // Arrange
      const canceledAt = new Date('2026-07-29T15:30:00.000Z');
      const issuedAt = new Date('2026-07-20T10:00:00.000Z');
      const row = await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: Date.now() % 100_000,
          rpsSeries: 'NFSE',
          status: NfseStatus.CANCELED,
          nfseNumber: '1001',
          verificationCode: 'XYZ999',
          issuedAt,
          canceledAt,
          cancelReasonCode: 4,
          data: {},
        },
      });

      // Act
      const result = await sut.findById(row.id);

      // Assert
      expect(result).toMatchObject({
        status: NfseStatus.CANCELED,
        nfseNumber: '1001',
        canceledAt,
        cancelReasonCode: 4,
      });
    });

    it('should return ISSUED fields via findById', async() => {
      // Arrange
      const issuedAt = new Date('2026-07-20T10:00:00.000Z');
      const row = await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: (Date.now() % 100_000) + 1,
          rpsSeries: 'NFSE',
          status: NfseStatus.ISSUED,
          nfseNumber: '2002',
          verificationCode: 'VER-ABC',
          issuedAt,
          data: {},
        },
      });

      // Act
      const result = await sut.findById(row.id);

      // Assert
      expect(result).toMatchObject({
        status: NfseStatus.ISSUED,
        nfseNumber: '2002',
        verificationCode: 'VER-ABC',
        issuedAt,
      });
    });

    it('should return bank payment fields via findById', async() => {
      // Arrange
      const issuedAt = new Date('2026-07-20T10:00:00.000Z');
      const settledAt = new Date('2026-09-17T12:00:00.000Z');
      const nextSettlementAt = new Date('2026-09-17T18:00:00.000Z');
      const row = await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: (Date.now() % 100_000) + 10,
          rpsSeries: 'NFSE',
          status: NfseStatus.ISSUED,
          nfseNumber: '2003',
          verificationCode: 'VER-BP',
          issuedAt,
          bankPaymentProvider: 'INTER',
          bankPaymentRequestCode: 'request-dao-1',
          bankPaymentSettledAt: settledAt,
          bankPaymentNextSettlementAt: nextSettlementAt,
          data: {},
        },
      });

      // Act
      const result = await sut.findById(row.id);

      // Assert
      expect(result).toMatchObject({
        bankPaymentProvider: 'INTER',
        bankPaymentRequestCode: 'request-dao-1',
        bankPaymentSettledAt: settledAt,
        bankPaymentNextSettlementAt: nextSettlementAt,
      });
    });

    it('should return SUBMITTED fields via findById', async() => {
      // Arrange
      const row = await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: (Date.now() % 100_000) + 2,
          rpsSeries: 'NFSE',
          status: NfseStatus.SUBMITTED,
          batchProtocol: 'protocol-xyz',
          data: {},
        },
      });

      // Act
      const result = await sut.findById(row.id);

      // Assert
      expect(result).toMatchObject({
        status: NfseStatus.SUBMITTED,
        batchProtocol: 'protocol-xyz',
      });
    });

    it('should return FAILED fields via findById', async() => {
      // Arrange
      const row = await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: (Date.now() % 100_000) + 3,
          rpsSeries: 'NFSE',
          status: NfseStatus.FAILED,
          errorMessage: 'Lote rejeitado pelo Giss',
          data: {},
        },
      });

      // Act
      const result = await sut.findById(row.id);

      // Assert
      expect(result).toMatchObject({
        status: NfseStatus.FAILED,
        errorMessage: 'Lote rejeitado pelo Giss',
      });
    });

    it('should return PROCESSING status via findById', async() => {
      // Arrange
      const row = await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: (Date.now() % 100_000) + 4,
          rpsSeries: 'NFSE',
          status: NfseStatus.PROCESSING,
          data: {},
        },
      });

      // Act
      const result = await sut.findById(row.id);

      // Assert
      expect(result).toMatchObject({
        status: NfseStatus.PROCESSING,
      });
    });

    it('should preserve UTF-8 characters in data JSON', async() => {
      // Arrange
      const data = {
        tomador: { nome: 'João da Silva', endereço: 'Rua Açúcar, nº 10 — São Paulo' },
        serviço: { descrição: 'Consultoria técnica' },
      };
      const row = await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: (Date.now() % 100_000) + 5,
          rpsSeries: 'NFSE',
          status: NfseStatus.PENDING,
          data,
        },
      });

      // Act
      const result = await sut.findById(row.id);

      // Assert
      expect(result?.data).toEqual(data);
    });
  });

  describe('findStuck', () => {
    async function seedNfse(overrides: {
      status?: NfseStatus;
      rpsNumber?: number;
      errorMessage?: string | null;
      nfseNumber?: string | null;
      olderThanMinutes?: number;
    } = {}) {
      const row = await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: overrides.rpsNumber ?? (Date.now() % 100_000) + Math.floor(Math.random() * 1000),
          rpsSeries: 'NFSE',
          status: overrides.status ?? NfseStatus.SUBMITTED,
          errorMessage: overrides.errorMessage ?? null,
          nfseNumber: overrides.nfseNumber ?? null,
          data: {},
        },
      });

      if (overrides.olderThanMinutes != null) {
        await prisma.$executeRawUnsafe(
          `UPDATE nfses SET "updatedAt" = NOW() - INTERVAL '${overrides.olderThanMinutes} minutes' WHERE id = ${row.id}`,
        );
      }

      return row;
    }

    it('should return non-terminal nfses older than the threshold', async() => {
      // Arrange
      const stuck = await seedNfse({
        status: NfseStatus.PROCESSING,
        errorMessage: 'ainda processando',
        olderThanMinutes: 180,
      });

      // Act
      const result = await sut.findStuck(120);

      // Assert
      expect(result).toEqual([
        expect.objectContaining({
          id: stuck.id,
          status: NfseStatus.PROCESSING,
          errorMessage: 'ainda processando',
          nfseNumber: null,
          issuedAt: null,
        }),
      ]);
      expect(result[0].updatedAt).toBeInstanceOf(Date);
      expect(result[0]).not.toHaveProperty('data');
    });

    it.each([
      NfseStatus.ISSUED,
      NfseStatus.FAILED,
      NfseStatus.CANCELED,
      NfseStatus.AWAITING_PROVIDER,
    ])('should exclude status %s from stuck results', async(status) => {
      // Arrange
      await seedNfse({
        status,
        nfseNumber: status === NfseStatus.ISSUED || status === NfseStatus.CANCELED ? '1' : null,
        olderThanMinutes: 180,
      });

      // Act
      const result = await sut.findStuck(120);

      // Assert
      expect(result).toEqual([]);
    });

    it('should exclude nfses updated inside the threshold window', async() => {
      // Arrange — recém-criado, sem backdate.
      await seedNfse({ status: NfseStatus.PENDING });

      // Act
      const result = await sut.findStuck(120);

      // Assert
      expect(result).toEqual([]);
    });

    it('should order stuck rows by updatedAt ascending', async() => {
      // Arrange
      const first = await seedNfse({ status: NfseStatus.PENDING, rpsNumber: 1, olderThanMinutes: 200 });
      const second = await seedNfse({ status: NfseStatus.SUBMITTED, rpsNumber: 2, olderThanMinutes: 150 });

      // Act
      const result = await sut.findStuck(120);

      // Assert
      expect(result.map((row) => row.id)).toEqual([first.id, second.id]);
    });
  });

  describe('findAwaitingProvider', () => {
    it('should return only AWAITING_PROVIDER rows', async() => {
      // Arrange
      const awaiting = await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: (Date.now() % 100_000) + 50,
          rpsSeries: 'NFSE',
          status: NfseStatus.AWAITING_PROVIDER,
          errorMessage: 'Provedor já conhece este RPS.',
          data: {},
        },
      });
      await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: (Date.now() % 100_000) + 51,
          rpsSeries: 'NFSE',
          status: NfseStatus.SUBMITTED,
          data: {},
        },
      });

      // Act
      const result = await sut.findAwaitingProvider();

      // Assert
      expect(result).toEqual([
        expect.objectContaining({
          id: awaiting.id,
          status: NfseStatus.AWAITING_PROVIDER,
          errorMessage: 'Provedor já conhece este RPS.',
        }),
      ]);
    });
  });

  describe('findIssuedWithoutBankPayment', () => {
    it('should return ISSUED nfses without bank payment older than the threshold', async() => {
      // Arrange
      const issuedAt = new Date(Date.now() - 2 * 60 * 60_000);
      const row = await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: (Date.now() % 100_000) + 60,
          rpsSeries: 'NFSE',
          status: NfseStatus.ISSUED,
          nfseNumber: '9001',
          issuedAt,
          bankPaymentRequestCode: null,
          data: {},
        },
      });

      // Act
      const result = await sut.findIssuedWithoutBankPayment(60);

      // Assert
      expect(result).toEqual([
        expect.objectContaining({
          id: row.id,
          status: NfseStatus.ISSUED,
          nfseNumber: '9001',
        }),
      ]);
    });

    it('should exclude issued nfses that already have a bank payment', async() => {
      // Arrange
      await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: (Date.now() % 100_000) + 61,
          rpsSeries: 'NFSE',
          status: NfseStatus.ISSUED,
          nfseNumber: '9002',
          issuedAt: new Date(Date.now() - 2 * 60 * 60_000),
          bankPaymentRequestCode: 'req-1',
          bankPaymentProvider: 'INTER',
          data: {},
        },
      });

      // Act
      const result = await sut.findIssuedWithoutBankPayment(60);

      // Assert
      expect(result).toEqual([]);
    });

    it('should exclude issued nfses still inside the threshold window', async() => {
      // Arrange
      await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: (Date.now() % 100_000) + 62,
          rpsSeries: 'NFSE',
          status: NfseStatus.ISSUED,
          nfseNumber: '9003',
          issuedAt: new Date(),
          bankPaymentRequestCode: null,
          data: {},
        },
      });

      // Act
      const result = await sut.findIssuedWithoutBankPayment(60);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('countIssuedByDay', () => {
    it('should count issued notes and those with bank payment inside [dayStart, dayEnd)', async() => {
      // Arrange
      const dayStart = new Date('2026-09-01T03:00:00.000Z');
      const dayEnd = new Date('2026-09-02T03:00:00.000Z');
      await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: (Date.now() % 100_000) + 70,
          rpsSeries: 'NFSE',
          status: NfseStatus.ISSUED,
          nfseNumber: '1',
          issuedAt: new Date('2026-09-01T12:00:00.000Z'),
          bankPaymentRequestCode: 'req-a',
          data: {},
        },
      });
      await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: (Date.now() % 100_000) + 71,
          rpsSeries: 'NFSE',
          status: NfseStatus.ISSUED,
          nfseNumber: '2',
          issuedAt: new Date('2026-09-01T18:00:00.000Z'),
          bankPaymentRequestCode: null,
          data: {},
        },
      });
      await prisma.nfse.create({
        data: {
          companyId: 1,
          clientId: 1,
          rpsNumber: (Date.now() % 100_000) + 72,
          rpsSeries: 'NFSE',
          status: NfseStatus.ISSUED,
          nfseNumber: '3',
          issuedAt: new Date('2026-09-02T04:00:00.000Z'),
          bankPaymentRequestCode: 'req-b',
          data: {},
        },
      });

      // Act
      const result = await sut.countIssuedByDay(dayStart, dayEnd);

      // Assert
      expect(result).toEqual({ issued: 2, withBankPayment: 1 });
    });
  });
  describe('findBankPaymentFailed', () => {
    it('should return issued notes whose charge failed', async() => {
      // Arrange
      await seed({ status: NfseStatus.ISSUED, bankPaymentFailedAt: new Date('2026-09-03T10:00:00Z') });
      await seed({ status: NfseStatus.ISSUED });

      // Act
      const result = await sut.findBankPaymentFailed();

      // Assert
      expect(result).toHaveLength(1);
    });

    it('should leave out notes that still have an automatic retry scheduled', async() => {
      // Arrange — o sistema ainda está cuidando delas; o alerta é para o que exige humano.
      await seed({
        status: NfseStatus.ISSUED,
        bankPaymentFailedAt: new Date('2026-09-03T10:00:00Z'),
        bankPaymentNextRetryAt: new Date('2026-09-03T10:05:00Z'),
      });

      // Act
      const result = await sut.findBankPaymentFailed();

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('findBankPaymentRetryDue', () => {
    it('should return only issued notes without a charge whose retry is due', async() => {
      // Arrange
      const due = await seed({ status: NfseStatus.ISSUED, bankPaymentNextRetryAt: new Date('2020-01-01T00:00:00Z') });
      await seed({ status: NfseStatus.ISSUED, bankPaymentNextRetryAt: new Date('2999-01-01T00:00:00Z') });
      await seed({ status: NfseStatus.ISSUED, bankPaymentFailedAt: new Date('2026-09-03T10:00:00Z') });
      await seed({
        status: NfseStatus.ISSUED,
        bankPaymentNextRetryAt: new Date('2020-01-01T00:00:00Z'),
        bankPaymentRequestCode: 'req-linked',
      });

      // Act
      const result = await sut.findBankPaymentRetryDue(200);

      // Assert
      expect(result.map((row) => row.id)).toEqual([due.id]);
    });
  });

  describe('findPendingReconciliation', () => {
    it('should return non terminal notes whose consultation is due', async() => {
      // Arrange
      const due = await seed({ status: NfseStatus.AWAITING_PROVIDER, nextReconcileAt: new Date('2020-01-01T00:00:00Z') });
      await seed({ status: NfseStatus.AWAITING_PROVIDER, nextReconcileAt: new Date('2999-01-01T00:00:00Z') });
      await seed({ status: NfseStatus.AWAITING_PROVIDER, nextReconcileAt: null });

      // Act
      const result = await sut.findPendingReconciliation(200);

      // Assert — `nextReconcileAt` nulo numa nota não terminal significa "não consultar mais".
      expect(result.map((row) => row.id)).toEqual([due.id]);
    });

    it('should chase AWAITING_PROVIDER, which the stuck alert deliberately ignores', async() => {
      // Arrange
      await seed({ status: NfseStatus.AWAITING_PROVIDER, nextReconcileAt: new Date('2020-01-01T00:00:00Z') });

      // Act
      const result = await sut.findPendingReconciliation(200);

      // Assert
      expect(result[0].status).toBe(NfseStatus.AWAITING_PROVIDER);
    });

    it.each([NfseStatus.ISSUED, NfseStatus.CANCELED, NfseStatus.FAILED, NfseStatus.REJECTED])(
      'should never return a %s note',
      async(status) => {
        // Arrange
        await seed({ status, nextReconcileAt: new Date('2020-01-01T00:00:00Z') });

        // Act
        const result = await sut.findPendingReconciliation(200);

        // Assert
        expect(result).toHaveLength(0);
      },
    );

    it('should respect the limit', async() => {
      // Arrange
      await seed({ status: NfseStatus.PENDING, nextReconcileAt: new Date('2020-01-01T00:00:00Z') });
      await seed({ status: NfseStatus.PENDING, nextReconcileAt: new Date('2020-01-02T00:00:00Z') });

      // Act
      const result = await sut.findPendingReconciliation(1);

      // Assert
      expect(result).toHaveLength(1);
    });
  });

  describe('findPendingByPeriod', () => {
    it('should return non terminal notes created inside the window', async() => {
      // Arrange
      const inside = await seed({ status: NfseStatus.AWAITING_PROVIDER, createdAt: new Date('2026-09-03T12:00:00Z') });
      await seed({ status: NfseStatus.AWAITING_PROVIDER, createdAt: new Date('2026-09-05T12:00:00Z') });
      await seed({ status: NfseStatus.ISSUED, createdAt: new Date('2026-09-03T12:00:00Z') });

      // Act
      const result = await sut.findPendingByPeriod(
        new Date('2026-09-03T00:00:00Z'),
        new Date('2026-09-04T00:00:00Z'),
      );

      // Assert
      expect(result.map((row) => row.id)).toEqual([inside.id]);
    });

    it('should carry the RPS natural key, which is what the matching needs', async() => {
      // Arrange
      const row = await seed({ status: NfseStatus.AWAITING_PROVIDER, createdAt: new Date('2026-09-03T12:00:00Z') });

      // Act
      const [result] = await sut.findPendingByPeriod(
        new Date('2026-09-03T00:00:00Z'),
        new Date('2026-09-04T00:00:00Z'),
      );

      // Assert
      expect(result).toEqual({
        id: row.id,
        companyId: row.companyId,
        rpsNumber: row.rpsNumber,
        rpsSeries: row.rpsSeries,
        status: NfseStatus.AWAITING_PROVIDER,
      });
    });
  });

  describe('findIssuedWithoutBankPaymentJob', () => {
    it('should return issued notes with neither charge nor recorded failure', async() => {
      // Arrange
      const pending = await seed({ status: NfseStatus.ISSUED });
      await seed({ status: NfseStatus.ISSUED, bankPaymentRequestCode: 'req-1' });
      await seed({ status: NfseStatus.ISSUED, bankPaymentFailedAt: new Date() });

      // Act
      const result = await sut.findIssuedWithoutBankPaymentJob(200);

      // Assert — quem já falhou tem motivo gravado e alerta próprio; reenfileirar seria laço infinito.
      expect(result.map((row) => row.id)).toEqual([pending.id]);
    });
  });

  describe('findBankPaymentUnconfirmed', () => {
    it('should return charges requested before the threshold and not yet confirmed', async() => {
      // Arrange
      const old = await seed({
        status: NfseStatus.ISSUED,
        bankPaymentRequestCode: 'req-old',
        bankPaymentRequestedAt: new Date(Date.now() - 60 * 60_000),
      });
      await seed({
        status: NfseStatus.ISSUED,
        bankPaymentRequestCode: 'req-new',
        bankPaymentRequestedAt: new Date(),
      });
      await seed({
        status: NfseStatus.ISSUED,
        bankPaymentRequestCode: 'req-confirmed',
        bankPaymentRequestedAt: new Date(Date.now() - 60 * 60_000),
        bankPaymentConfirmedAt: new Date(),
      });

      // Act
      const result = await sut.findBankPaymentUnconfirmed(10, 200);

      // Assert
      expect(result.map((row) => row.id)).toEqual([old.id]);
    });

    it('should exclude charges whose Inter GET already recorded FALHA_EMISSAO', async() => {
      // Arrange — confirmedAt nulo é correto (boleto não cobrável), mas o GET eterno não.
      const pending = await seed({
        status: NfseStatus.ISSUED,
        bankPaymentRequestCode: 'req-pending',
        bankPaymentRequestedAt: new Date(Date.now() - 60 * 60_000),
      });
      await seed({
        status: NfseStatus.ISSUED,
        bankPaymentRequestCode: 'req-failed',
        bankPaymentRequestedAt: new Date(Date.now() - 60 * 60_000),
        bankPaymentFailedAt: new Date(),
      });

      // Act
      const result = await sut.findBankPaymentUnconfirmed(10, 200);

      // Assert
      expect(result.map((row) => row.id)).toEqual([pending.id]);
    });
  });

  describe('findBankPaymentSettlementDue', () => {
    it('should return confirmed charges whose settlement check is due', async() => {
      // Arrange
      const due = await seed({
        status: NfseStatus.ISSUED,
        bankPaymentRequestCode: 'req-due',
        bankPaymentConfirmedAt: new Date('2026-09-03T11:00:00Z'),
        bankPaymentNextSettlementAt: new Date(Date.now() - 60_000),
      });
      await seed({
        status: NfseStatus.ISSUED,
        bankPaymentRequestCode: 'req-future',
        bankPaymentConfirmedAt: new Date('2026-09-03T11:00:00Z'),
        bankPaymentNextSettlementAt: new Date(Date.now() + 60 * 60_000),
      });
      await seed({
        status: NfseStatus.ISSUED,
        bankPaymentRequestCode: 'req-paid',
        bankPaymentConfirmedAt: new Date('2026-09-03T11:00:00Z'),
        bankPaymentSettledAt: new Date(),
        bankPaymentNextSettlementAt: new Date(Date.now() - 60_000),
      });
      await seed({
        status: NfseStatus.ISSUED,
        bankPaymentRequestCode: 'req-unconfirmed',
        bankPaymentNextSettlementAt: new Date(Date.now() - 60_000),
      });

      // Act
      const result = await sut.findBankPaymentSettlementDue(200);

      // Assert
      expect(result.map((row) => row.id)).toEqual([due.id]);
    });

    it('should exclude charges whose Inter GET already recorded FALHA_EMISSAO', async() => {
      // Arrange
      const pending = await seed({
        status: NfseStatus.ISSUED,
        bankPaymentRequestCode: 'req-open',
        bankPaymentConfirmedAt: new Date('2026-09-03T11:00:00Z'),
        bankPaymentNextSettlementAt: new Date(Date.now() - 60_000),
      });
      await seed({
        status: NfseStatus.ISSUED,
        bankPaymentRequestCode: 'req-failed',
        bankPaymentConfirmedAt: new Date('2026-09-03T11:00:00Z'),
        bankPaymentFailedAt: new Date(),
        bankPaymentNextSettlementAt: new Date(Date.now() - 60_000),
      });

      // Act
      const result = await sut.findBankPaymentSettlementDue(200);

      // Assert
      expect(result.map((row) => row.id)).toEqual([pending.id]);
    });

    it('should return the oldest due charge first and respect the limit', async() => {
      // Arrange
      const older = await seed({
        status: NfseStatus.ISSUED,
        bankPaymentRequestCode: 'req-older',
        bankPaymentConfirmedAt: new Date('2026-09-03T11:00:00Z'),
        bankPaymentNextSettlementAt: new Date(Date.now() - 120_000),
      });
      await seed({
        status: NfseStatus.ISSUED,
        bankPaymentRequestCode: 'req-newer',
        bankPaymentConfirmedAt: new Date('2026-09-03T11:00:00Z'),
        bankPaymentNextSettlementAt: new Date(Date.now() - 30_000),
      });

      // Act
      const limited = await sut.findBankPaymentSettlementDue(1);

      // Assert
      expect(limited.map((row) => row.id)).toEqual([older.id]);
    });

    it('should exclude confirmed charges that have no next settlement check', async() => {
      // Arrange
      const due = await seed({
        status: NfseStatus.ISSUED,
        bankPaymentRequestCode: 'req-due-scheduled',
        bankPaymentConfirmedAt: new Date('2026-09-03T11:00:00Z'),
        bankPaymentNextSettlementAt: new Date(Date.now() - 60_000),
      });
      await seed({
        status: NfseStatus.ISSUED,
        bankPaymentRequestCode: 'req-no-schedule',
        bankPaymentConfirmedAt: new Date('2026-09-03T11:00:00Z'),
        bankPaymentNextSettlementAt: null,
      });

      // Act
      const result = await sut.findBankPaymentSettlementDue(200);

      // Assert
      expect(result.map((row) => row.id)).toEqual([due.id]);
    });
  });

  describe('métricas', () => {
    it('should count notes by status', async() => {
      // Arrange
      await seed({ status: NfseStatus.ISSUED });
      await seed({ status: NfseStatus.ISSUED });
      await seed({ status: NfseStatus.AWAITING_PROVIDER });

      // Act
      const result = await sut.countByStatus();

      // Assert
      expect(result).toEqual(expect.arrayContaining([
        { key: NfseStatus.ISSUED, count: 2 },
        { key: NfseStatus.AWAITING_PROVIDER, count: 1 },
      ]));
    });

    it('should count charges by confirmed status, treating not-yet-confirmed as its own bucket', async() => {
      // Arrange
      await seed({ status: NfseStatus.ISSUED, bankPaymentRequestCode: 'a', bankPaymentStatus: 'EMITTED' });
      await seed({ status: NfseStatus.ISSUED, bankPaymentRequestCode: 'b' });
      await seed({ status: NfseStatus.ISSUED });

      // Act
      const result = await sut.countByBankPaymentStatus();

      // Assert — a nota sem `bankPaymentRequestCode` não é cobrança nenhuma e fica fora.
      expect(result).toEqual(expect.arrayContaining([
        { key: 'EMITTED', count: 1 },
        { key: 'UNCONFIRMED', count: 1 },
      ]));
      expect(result).toHaveLength(2);
    });

    it('should count what is stuck and what is issued without a charge', async() => {
      // Arrange
      const old = new Date(Date.now() - 5 * 60 * 60 * 1000);
      await seed({ status: NfseStatus.SUBMITTED, updatedAt: old });
      await seed({ status: NfseStatus.SUBMITTED });
      await seed({ status: NfseStatus.ISSUED, issuedAt: old });

      // Act
      const [stuck, withoutCharge] = await Promise.all([
        sut.countStuck(120),
        sut.countIssuedWithoutBankPayment(60),
      ]);

      // Assert
      expect(stuck).toBe(1);
      expect(withoutCharge).toBe(1);
    });

    it('should summarize provider calls from the attempt trail', async() => {
      // Arrange
      const nfse = await seed();
      await prisma.nfseAttempt.createMany({
        data: [
          { nfseId: nfse.id, operation: 'GISS_CONSULTAR_LOTE', durationMs: 100, errorClass: null },
          { nfseId: nfse.id, operation: 'GISS_CONSULTAR_LOTE', durationMs: 300, errorClass: 'TransientProviderError' },
          { nfseId: nfse.id, operation: 'INTER_ISSUE', durationMs: 50, errorClass: null },
        ],
      });

      // Act
      const result = await sut.findProviderCallStats(60);

      // Assert
      expect(result[0]).toEqual({
        operation: 'GISS_CONSULTAR_LOTE',
        calls: 2,
        errors: 1,
        averageDurationMs: 200,
        maxDurationMs: 300,
      });
    });

    it('should ignore attempts older than the window', async() => {
      // Arrange
      const nfse = await seed();
      await prisma.nfseAttempt.create({
        data: {
          nfseId: nfse.id,
          operation: 'GISS_RECEPCIONAR_LOTE',
          durationMs: 100,
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        },
      });

      // Act
      const result = await sut.findProviderCallStats(60);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
