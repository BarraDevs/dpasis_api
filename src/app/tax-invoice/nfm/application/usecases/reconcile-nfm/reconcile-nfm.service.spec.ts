import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ReconcileNfseSource } from 'src/app/tax-invoice/nfse/application/usecases/reconcile-nfse/dtos/reconcile-nfse.dto';
import { ReconcileNfse } from 'src/app/tax-invoice/nfse/application/usecases/reconcile-nfse/reconcile-nfse.service';
import { Nfse, NfseProps } from 'src/app/tax-invoice/nfse/domain/entities/nfse.entity';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { NfseFactory } from 'src/app/tax-invoice/nfse/domain/factories/nfse.factory';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { Nfm } from '../../../domain/entities/nfm.entity';
import { NfmNfseMissingError } from '../../../domain/errors/nfm-nfse-missing.error';
import { NfmNotFoundError } from '../../../domain/errors/nfm-not-found.error';
import { NfmFactory } from '../../../domain/factories/nfm.factory';
import type { INfmRepository } from '../../persistence/repository/nfm-repository.interface';
import { ReconcileNfm } from './reconcile-nfm.service';

function makeNfseProps(overrides: Partial<NfseProps> = {}): NfseProps {
  return {
    id: 99,
    companyId: 1,
    clientId: 1,
    rpsNumber: 41,
    rpsSeries: 'NFSE',
    status: NfseStatus.AWAITING_PROVIDER,
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
    createdAt: new Date('2026-09-01T12:00:00Z'),
    nfmId: 10,
    data: {},
    ...overrides,
  };
}

function makeNfm(nfse: Nfse | null): Nfm {
  const entity = NfmFactory.load({
    id: 10,
    clientId: 1,
    clientDocument: '00000000000101',
    companyName: 'Empresa',
    referenceMonth: 8,
    referenceYear: 2026,
    totalValueInCents: 1000,
    cnaeNbsIndopId: 1,
    data: {},
    nfse: null,
  });

  if (nfse) {
    entity.linkNfse(nfse);
  }

  return entity;
}

describe('ReconcileNfm - Unit tests', () => {
  let sut: ReconcileNfm;
  let nfmRepository: INfmRepository;
  let reconcileNfse: ReconcileNfse;
  let logger: ILoggerGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        ReconcileNfm,
        { provide: TOKENS.NfmRepository, useValue: createMock<INfmRepository>() },
        { provide: TOKENS.LoggerGateway, useValue: createMock<ILoggerGateway>() },
        { provide: ReconcileNfse, useValue: createMock<ReconcileNfse>() },
      ],
    }).compile();

    sut = module.get(ReconcileNfm);
    nfmRepository = module.get(TOKENS.NfmRepository);
    reconcileNfse = module.get(ReconcileNfse);
    logger = module.get(TOKENS.LoggerGateway);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw when the nfm does not exist', async() => {
    // Arrange
    jest.spyOn(nfmRepository, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(10, { reason: 'nota parada' })).rejects.toThrow(NfmNotFoundError);
  });

  it('should throw when the nfm has no linked nfse', async() => {
    // Arrange
    jest.spyOn(nfmRepository, 'findById').mockResolvedValue(makeNfm(null));

    // Act & Assert
    await expect(sut.execute(10, { reason: 'nota parada' })).rejects.toThrow(NfmNfseMissingError);
  });

  it('should delegate to the per-note reconciliation and return its outcome', async() => {
    // Arrange
    const outcome = {
      nfseId: 99,
      previousStatus: NfseStatus.AWAITING_PROVIDER,
      newStatus: NfseStatus.ISSUED,
      source: ReconcileNfseSource.ProviderIssued,
      nfseNumber: '12345',
    };
    jest.spyOn(nfmRepository, 'findById').mockResolvedValue(makeNfm(NfseFactory.load(makeNfseProps())));
    jest.spyOn(reconcileNfse, 'execute').mockResolvedValue(outcome);

    // Act
    const result = await sut.execute(10, { reason: 'nota parada desde o incidente' });

    // Assert
    expect(reconcileNfse.execute).toHaveBeenCalledWith({ nfseId: 99 });
    expect(result).toBe(outcome);
  });

  it('should record who asked and why', async() => {
    // Arrange
    jest.spyOn(nfmRepository, 'findById').mockResolvedValue(makeNfm(NfseFactory.load(makeNfseProps())));
    jest.spyOn(reconcileNfse, 'execute').mockResolvedValue({
      nfseId: 99,
      previousStatus: NfseStatus.AWAITING_PROVIDER,
      newStatus: NfseStatus.AWAITING_PROVIDER,
      source: ReconcileNfseSource.ProviderNotFoundPolling,
    });

    // Act
    await sut.execute(10, { reason: 'chamado 1234 do cliente' });

    // Assert
    expect(logger.debug).toHaveBeenCalledWith(LogContext.NFS_GENERATION, expect.objectContaining({
      action: 'reconcileNfm',
      nfmId: 10,
      nfseId: 99,
      reason: 'chamado 1234 do cliente',
    }));
  });
});
