import { Test } from '@nestjs/testing';
import { NfmAlreadyHasActiveNfseError } from 'src/app/tax-invoice/nfm/domain/errors/nfm-already-has-active-nfse.error';
import { NfseCreateProps } from 'src/app/tax-invoice/nfse/domain/entities/nfse.entity';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { NfseFactory } from 'src/app/tax-invoice/nfse/domain/factories/nfse.factory';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { JobName } from 'src/infra/queue/enums/job-name.enum';
import { NfseRepositoryAdapterPrisma } from './nfse-prisma.repository';

function makeNfseCreateProps(overrides: Partial<NfseCreateProps> = {}): NfseCreateProps {
  return {
    companyId: 1,
    clientId: 1,
    rpsNumber: Date.now() % 100_000,
    rpsSeries: 'NFSE',
    data: { providerDocument: '12345678000199', input: { service: { description: 'Serviço teste' } } },
    ...overrides,
  };
}

describe('NfseRepositoryAdapterPrisma - Integration tests', () => {
  let sut: NfseRepositoryAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [NfseRepositoryAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(NfseRepositoryAdapterPrisma);
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

  describe('save', () => {
    it('should persist the nfse with PENDING status and return the id', async() => {
      // Arrange
      const props = makeNfseCreateProps();
      const entity = NfseFactory.create(props);

      // Act
      const id = await sut.save(entity);

      // Assert
      expect(typeof id).toBe('number');

      const saved = await prisma.nfse.findUnique({ where: { id } });
      expect(saved).toMatchObject({
        companyId: props.companyId,
        clientId: props.clientId,
        rpsNumber: props.rpsNumber,
        rpsSeries: props.rpsSeries,
        status: NfseStatus.PENDING,
        data: props.data,
      });
    });

    it('should reject duplicate companyId + rpsSeries + rpsNumber', async() => {
      // Arrange
      const props = makeNfseCreateProps({ rpsNumber: 42_001 });
      await sut.save(NfseFactory.create(props));

      // Act & Assert
      await expect(sut.save(NfseFactory.create(props))).rejects.toThrow();
    });

    it('should persist empty data object', async() => {
      // Arrange
      const props = makeNfseCreateProps({ data: {} });
      const entity = NfseFactory.create(props);

      // Act
      const id = await sut.save(entity);

      // Assert
      const saved = await prisma.nfse.findUnique({ where: { id } });
      expect(saved?.data).toEqual({});
    });
  });

  describe('findById', () => {
    it('should return null when the nfse does not exist', async() => {
      // Act
      const result = await sut.findById(999_999);

      // Assert
      expect(result).toBeNull();
    });

    it('should rehydrate the nfse entity via Factory', async() => {
      // Arrange
      const props = makeNfseCreateProps();
      const id = await sut.save(NfseFactory.create(props));

      // Act
      const result = await sut.findById(id);

      // Assert
      expect(result?.props).toMatchObject({
        id,
        companyId: props.companyId,
        clientId: props.clientId,
        rpsNumber: props.rpsNumber,
        rpsSeries: props.rpsSeries,
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
        data: props.data,
      });
    });

    it('should rehydrate ISSUED fields via findById', async() => {
      // Arrange
      const id = await sut.save(NfseFactory.create(makeNfseCreateProps()));
      const issuedAt = new Date('2026-07-20T10:00:00.000Z');
      const entity = await sut.findById(id);
      entity!.markIssued('3003', 'ISS-XYZ', issuedAt);
      await sut.edit(entity!);

      // Act
      const result = await sut.findById(id);

      // Assert
      expect(result?.props).toMatchObject({
        status: NfseStatus.ISSUED,
        nfseNumber: '3003',
        verificationCode: 'ISS-XYZ',
        issuedAt,
      });
    });
  });

  describe('edit', () => {
    it('should persist status fields after markSubmitted', async() => {
      // Arrange
      const id = await sut.save(NfseFactory.create(makeNfseCreateProps()));
      const entity = await sut.findById(id);
      entity!.markSubmitted('protocol-123');

      // Act
      await sut.edit(entity!);

      // Assert
      const saved = await prisma.nfse.findUnique({ where: { id } });
      expect(saved).toMatchObject({
        status: NfseStatus.SUBMITTED,
        batchProtocol: 'protocol-123',
      });
    });

    it('should persist FAILED status with errorMessage', async() => {
      // Arrange
      const id = await sut.save(NfseFactory.create(makeNfseCreateProps()));
      const entity = await sut.findById(id);
      entity!.markFailed('Lote rejeitado pelo Giss');

      // Act
      await sut.edit(entity!);

      // Assert
      const saved = await prisma.nfse.findUnique({ where: { id } });
      expect(saved).toMatchObject({
        status: NfseStatus.FAILED,
        errorMessage: 'Lote rejeitado pelo Giss',
      });
    });

    it('should persist CANCELED status with canceledAt and cancelReasonCode', async() => {
      // Arrange
      const id = await sut.save(NfseFactory.create(makeNfseCreateProps()));
      const issuedAt = new Date('2026-07-20T10:00:00.000Z');
      const canceledAt = new Date('2026-07-29T12:00:00.000Z');

      let entity = await sut.findById(id);
      entity!.markIssued('1000', 'ABC123', issuedAt);
      await sut.edit(entity!);

      entity = await sut.findById(id);
      entity!.markCanceled(canceledAt, 2);

      // Act
      await sut.edit(entity!);

      // Assert
      const saved = await prisma.nfse.findUnique({ where: { id } });
      expect(saved).toMatchObject({
        status: NfseStatus.CANCELED,
        nfseNumber: '1000',
        verificationCode: 'ABC123',
        issuedAt,
        canceledAt,
        cancelReasonCode: 2,
      });
    });

    it('should return canceled fields via findById after cancellation', async() => {
      // Arrange
      const id = await sut.save(NfseFactory.create(makeNfseCreateProps()));
      const canceledAt = new Date('2026-07-29T15:30:00.000Z');

      let entity = await sut.findById(id);
      entity!.markIssued('1001', 'XYZ999', new Date('2026-07-20T10:00:00.000Z'));
      await sut.edit(entity!);

      entity = await sut.findById(id);
      entity!.markCanceled(canceledAt, 4);
      await sut.edit(entity!);

      // Act
      const result = await sut.findById(id);

      // Assert
      expect(result?.props).toMatchObject({
        status: NfseStatus.CANCELED,
        nfseNumber: '1001',
        canceledAt,
        cancelReasonCode: 4,
      });
    });

    it('should persist ISSUED status after markIssued', async() => {
      // Arrange
      const id = await sut.save(NfseFactory.create(makeNfseCreateProps()));
      const issuedAt = new Date('2026-07-20T10:00:00.000Z');
      const entity = await sut.findById(id);
      entity!.markIssued('4004', 'VER-4004', issuedAt);

      // Act
      await sut.edit(entity!);

      // Assert
      const saved = await prisma.nfse.findUnique({ where: { id } });
      expect(saved).toMatchObject({
        status: NfseStatus.ISSUED,
        nfseNumber: '4004',
        verificationCode: 'VER-4004',
        issuedAt,
      });
    });

    it('should persist and rehydrate bank payment fields after linkBankPayment', async() => {
      // Arrange
      const id = await sut.save(NfseFactory.create(makeNfseCreateProps()));
      const issuedAt = new Date('2026-07-20T10:00:00.000Z');
      let entity = await sut.findById(id);
      entity!.markIssued('5005', 'VER-5005', issuedAt);
      await sut.edit(entity!);

      entity = await sut.findById(id);
      entity!.linkBankPayment('INTER', 'request-code-repo');

      // Act
      await sut.edit(entity!);
      const result = await sut.findById(id);

      // Assert
      expect(result?.props).toMatchObject({
        bankPaymentProvider: 'INTER',
        bankPaymentRequestCode: 'request-code-repo',
      });
      const saved = await prisma.nfse.findUnique({ where: { id } });
      expect(saved).toMatchObject({
        bankPaymentProvider: 'INTER',
        bankPaymentRequestCode: 'request-code-repo',
      });
    });

    it('should persist and rehydrate bankPaymentRequestedAt and bankPaymentFailedAt', async() => {
      // Arrange
      const id = await sut.save(NfseFactory.create(makeNfseCreateProps()));
      const issuedAt = new Date('2026-07-20T10:00:00.000Z');
      let entity = await sut.findById(id);
      entity!.markIssued('6006', 'VER-6006', issuedAt);
      await sut.edit(entity!);

      entity = await sut.findById(id);
      entity!.markBankPaymentRequested(`nfse-${id}`);
      entity!.markBankPaymentFailed('Inter recusou');

      // Act
      await sut.edit(entity!);
      const result = await sut.findById(id);

      // Assert
      expect(result?.props.bankPaymentIdempotencyKey).toBe(`nfse-${id}`);
      expect(result?.props.bankPaymentRequestedAt).toBeInstanceOf(Date);
      expect(result?.props.bankPaymentErrorMessage).toBe('Inter recusou');
      expect(result?.props.bankPaymentFailedAt).toBeInstanceOf(Date);
      expect(result?.props.status).toBe(NfseStatus.ISSUED);
    });

    it('should persist PROCESSING status after markProcessing', async() => {
      // Arrange
      const id = await sut.save(NfseFactory.create(makeNfseCreateProps()));
      const entity = await sut.findById(id);
      entity!.markProcessing();

      // Act
      await sut.edit(entity!);

      // Assert
      const saved = await prisma.nfse.findUnique({ where: { id } });
      expect(saved).toMatchObject({
        status: NfseStatus.PROCESSING,
      });
    });

    it('should not mutate companyId, clientId or rps fields on edit', async() => {
      // Arrange
      const props = makeNfseCreateProps({
        companyId: 7,
        clientId: 8,
        rpsNumber: 55_001,
        rpsSeries: 'A1',
      });
      const id = await sut.save(NfseFactory.create(props));
      const entity = await sut.findById(id);
      entity!.markSubmitted('protocol-immutable');

      // Act
      await sut.edit(entity!);

      // Assert
      const saved = await prisma.nfse.findUnique({ where: { id } });
      expect(saved).toMatchObject({
        companyId: 7,
        clientId: 8,
        rpsNumber: 55_001,
        rpsSeries: 'A1',
        status: NfseStatus.SUBMITTED,
        batchProtocol: 'protocol-immutable',
      });
    });

    it('should reject edit when the nfse id does not exist', async() => {
      // Arrange
      const entity = NfseFactory.load({
        id: 999_999,
        companyId: 1,
        clientId: 1,
        rpsNumber: 1,
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
        bankPaymentIdempotencyKey: null,
        bankPaymentRequestedAt: null,
        bankPaymentErrorMessage: null,
        bankPaymentFailedAt: null,
        bankPaymentStatus: null,
        bankPaymentConfirmedAt: null,
        reconcileAttemptCount: 0,
        nextReconcileAt: null,
        createdAt: new Date('2026-07-20T12:00:00Z'),
        nfmId: null,
        data: {},
      });
      entity.markSubmitted('protocol-missing');

      // Act & Assert
      await expect(sut.edit(entity)).rejects.toThrow();
    });
  });

  describe('bank payment retry', () => {
    async function seedIssued(overrides: { bankPaymentNextRetryAt?: Date | null; bankPaymentRequestCode?: string | null } = {}) {
      const id = await sut.save(NfseFactory.create(makeNfseCreateProps()));
      await prisma.nfse.update({
        where: { id },
        data: {
          status: NfseStatus.ISSUED,
          nfseNumber: '7007',
          issuedAt: new Date('2026-09-10T12:00:00Z'),
          ...overrides,
        },
      });
      return id;
    }

    it('should persist and rehydrate the retry schedule via edit', async() => {
      // Arrange
      const id = await seedIssued();
      const next = new Date('2026-09-10T12:05:00.000Z');
      const entity = await sut.findById(id);
      entity!.markBankPaymentFailed('Banco Inter indisponível.');
      entity!.scheduleBankPaymentRetry(next);

      // Act
      await sut.edit(entity!);
      const result = await sut.findById(id);

      // Assert
      expect(result?.props.bankPaymentNextRetryAt).toEqual(next);
      expect(result?.props.bankPaymentRetryCount).toBe(0);
    });

    it('should let only one claim through, pushing the lease forward and counting the round', async() => {
      // Arrange
      const id = await seedIssued({ bankPaymentNextRetryAt: new Date('2026-09-10T12:00:00.000Z') });
      const now = new Date('2026-09-10T12:05:00.000Z');
      const leaseUntil = new Date('2026-09-10T12:20:00.000Z');

      // Act — duas réplicas disputando a mesma nota na mesma volta da varredura.
      const first = await sut.claimBankPaymentRetry(id, now, leaseUntil);
      const second = await sut.claimBankPaymentRetry(id, now, leaseUntil);

      // Assert
      expect(first).toBe(true);
      expect(second).toBe(false);
      const saved = await prisma.nfse.findUnique({ where: { id } });
      expect(saved?.bankPaymentNextRetryAt).toEqual(leaseUntil);
      expect(saved?.bankPaymentRetryCount).toBe(1);
    });

    it('should not claim a note whose charge got linked in the meantime', async() => {
      // Arrange
      const id = await seedIssued({
        bankPaymentNextRetryAt: new Date('2026-09-10T12:00:00.000Z'),
        bankPaymentRequestCode: 'req-linked',
      });

      // Act
      const claimed = await sut.claimBankPaymentRetry(
        id,
        new Date('2026-09-10T12:05:00.000Z'),
        new Date('2026-09-10T12:20:00.000Z'),
      );

      // Assert
      expect(claimed).toBe(false);
    });
  });

  describe('bank payment settlement', () => {
    async function seedConfirmed(overrides: Record<string, unknown> = {}) {
      const id = await sut.save(NfseFactory.create(makeNfseCreateProps()));
      await prisma.nfse.update({
        where: { id },
        data: {
          status: NfseStatus.ISSUED,
          nfseNumber: '8008',
          issuedAt: new Date('2026-09-10T12:00:00Z'),
          bankPaymentRequestCode: 'req-settle',
          bankPaymentConfirmedAt: new Date('2026-09-10T12:10:00Z'),
          bankPaymentStatus: 'EMITTED',
          bankPaymentNextSettlementAt: new Date('2026-09-10T12:00:00.000Z'),
          ...overrides,
        },
      });
      return id;
    }

    it('should rehydrate a charge by request code', async() => {
      // Arrange
      const settledAt = new Date('2026-09-17T12:00:00.000Z');
      const id = await seedConfirmed({ bankPaymentSettledAt: settledAt });

      // Act
      const result = await sut.findByBankPaymentRequestCode('req-settle');

      // Assert
      expect(result?.props.id).toBe(id);
      expect(result?.props.bankPaymentRequestCode).toBe('req-settle');
      expect(result?.props.bankPaymentSettledAt).toEqual(settledAt);
    });

    it('should return null when the request code is unknown', async() => {
      await expect(sut.findByBankPaymentRequestCode('missing')).resolves.toBeNull();
    });

    it('should let only one claim through, pushing the lease forward', async() => {
      // Arrange
      const id = await seedConfirmed();
      const now = new Date('2026-09-10T12:05:00.000Z');
      const leaseUntil = new Date('2026-09-10T12:20:00.000Z');

      // Act
      const first = await sut.claimBankPaymentSettlement(id, now, leaseUntil);
      const second = await sut.claimBankPaymentSettlement(id, now, leaseUntil);

      // Assert
      expect(first).toBe(true);
      expect(second).toBe(false);
      const saved = await prisma.nfse.findUnique({ where: { id } });
      expect(saved?.bankPaymentNextSettlementAt).toEqual(leaseUntil);
    });

    it('should not claim a charge that already settled', async() => {
      // Arrange
      const id = await seedConfirmed({ bankPaymentSettledAt: new Date('2026-09-10T12:30:00.000Z') });

      // Act
      const claimed = await sut.claimBankPaymentSettlement(
        id,
        new Date('2026-09-10T12:35:00.000Z'),
        new Date('2026-09-10T12:50:00.000Z'),
      );

      // Assert
      expect(claimed).toBe(false);
    });

    it('should not claim a charge whose next check is still in the future', async() => {
      // Arrange
      const id = await seedConfirmed({
        bankPaymentNextSettlementAt: new Date('2026-09-10T13:00:00.000Z'),
      });

      // Act
      const claimed = await sut.claimBankPaymentSettlement(
        id,
        new Date('2026-09-10T12:05:00.000Z'),
        new Date('2026-09-10T12:20:00.000Z'),
      );

      // Assert
      expect(claimed).toBe(false);
    });

    it.each([
      { label: 'unconfirmed', overrides: { bankPaymentConfirmedAt: null } },
      { label: 'failed', overrides: { bankPaymentFailedAt: new Date('2026-09-10T12:20:00.000Z') } },
      { label: 'without a request code', overrides: { bankPaymentRequestCode: null } },
    ])('should not claim a $label charge', async({ overrides }) => {
      // Arrange
      const id = await seedConfirmed(overrides);

      // Act
      const claimed = await sut.claimBankPaymentSettlement(
        id,
        new Date('2026-09-10T12:05:00.000Z'),
        new Date('2026-09-10T12:20:00.000Z'),
      );

      // Assert
      expect(claimed).toBe(false);
    });
  });

  describe('reserve', () => {
    let cnaeNbsIndopId: number;

    async function seedTaxation(): Promise<number> {
      const suffix = String(Date.now()).slice(-8) + String(Math.floor(Math.random() * 1000));
      const cnae = await prisma.cnae.create({ data: { code: `C${suffix}`, description: 'CNAE RESERVE' } });
      const nbs = await prisma.nbs.create({ data: { code: `N${suffix}`, description: 'NBS RESERVE' } });
      const indop = await prisma.indop.create({ data: { code: `I${suffix}`, description: 'INDOP RESERVE' } });
      const correlation = await prisma.cnaeNbsIndop.create({
        data: { cnaeId: cnae.id, nbsId: nbs.id, indopId: indop.id, serviceListItemCode: '01.07' },
      });
      return correlation.id;
    }

    async function seedNfm(): Promise<number> {
      const row = await prisma.nfm.create({
        data: {
          clientId: 1,
          clientDocument: '00000000000101',
          companyName: 'Empresa Teste',
          referenceMonth: 1,
          referenceYear: 2026,
          totalValueInCents: 10000,
          cnaeNbsIndopId,
          data: {},
        },
        select: { id: true },
      });
      return row.id;
    }

    function makeReserveInput(nfmId: number | null) {
      return {
        companyId: 1,
        clientId: 1,
        rpsSeries: 'NFSE',
        data: { providerDocument: '12345678000199' },
        nfmId,
        jobName: JobName.IssueNfseBatch,
      };
    }

    beforeEach(async() => {
      cnaeNbsIndopId = await seedTaxation();
    });

    it('should create the nfse, link the nfm on both sides and register the outbox row in one transaction', async() => {
      // Arrange
      const nfmId = await seedNfm();

      // Act
      const result = await sut.reserve(makeReserveInput(nfmId));

      // Assert
      expect(result.rpsNumber).toBe(1);
      const nfse = await prisma.nfse.findUnique({ where: { id: result.nfseId } });
      expect(nfse).toMatchObject({ status: NfseStatus.PENDING, rpsNumber: 1, rpsSeries: 'NFSE', nfmId });
      const nfm = await prisma.nfm.findUnique({ where: { id: nfmId } });
      expect(nfm?.nfseId).toBe(result.nfseId);
      const outbox = await prisma.nfseOutbox.findUnique({ where: { id: result.outboxId } });
      expect(outbox).toMatchObject({
        nfseId: result.nfseId,
        jobName: JobName.IssueNfseBatch,
        payload: { nfseId: result.nfseId },
        dispatchedAt: null,
      });
    });

    it('should refuse a second active nfse for the same nfm', async() => {
      // Arrange
      const nfmId = await seedNfm();
      await sut.reserve(makeReserveInput(nfmId));

      // Act & Assert
      await expect(sut.reserve(makeReserveInput(nfmId))).rejects.toThrow(NfmAlreadyHasActiveNfseError);
    });

    it('should allow a new nfse when the previous one for the same nfm is FAILED', async() => {
      // Arrange — reemissão autorizada depois de uma rejeição de negócio.
      const nfmId = await seedNfm();
      const first = await sut.reserve(makeReserveInput(nfmId));
      await prisma.nfse.update({ where: { id: first.nfseId }, data: { status: NfseStatus.FAILED } });

      // Act
      const second = await sut.reserve(makeReserveInput(nfmId));

      // Assert
      expect(second.nfseId).not.toBe(first.nfseId);
      expect(second.rpsNumber).toBe(2);
    });

    it('should refuse a new nfse when the previous one for the same nfm is CANCELED', async() => {
      // Arrange — CANCELED permanece no índice parcial (só FAILED/REJECTED saem).
      const nfmId = await seedNfm();
      const first = await sut.reserve(makeReserveInput(nfmId));
      await prisma.nfse.update({ where: { id: first.nfseId }, data: { status: NfseStatus.CANCELED } });

      // Act & Assert
      await expect(sut.reserve(makeReserveInput(nfmId))).rejects.toThrow(NfmAlreadyHasActiveNfseError);
    });

    it('should give the rps number back when the transaction rolls back', async() => {
      // Arrange — nfmId inexistente faz o UPDATE da NFM falhar depois de o RPS ter sido consumido.
      await expect(sut.reserve(makeReserveInput(999_999))).rejects.toThrow();

      // Act
      const afterRollback = await sut.reserve(makeReserveInput(null));

      // Assert
      expect(afterRollback.rpsNumber).toBe(1);
    });

    it('should mark the outbox row as dispatched', async() => {
      // Arrange
      const reserved = await sut.reserve(makeReserveInput(null));

      // Act
      await sut.markOutboxDispatched(reserved.outboxId);

      // Assert
      const outbox = await prisma.nfseOutbox.findUnique({ where: { id: reserved.outboxId } });
      expect(outbox?.dispatchedAt).toBeInstanceOf(Date);
    });
  });

});
