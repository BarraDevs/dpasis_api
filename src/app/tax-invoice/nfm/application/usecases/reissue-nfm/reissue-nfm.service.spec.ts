import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ReconcileNfseSource } from 'src/app/tax-invoice/nfse/application/usecases/reconcile-nfse/dtos/reconcile-nfse.dto';
import { ReconcileNfse } from 'src/app/tax-invoice/nfse/application/usecases/reconcile-nfse/reconcile-nfse.service';
import type { INfseRepository } from 'src/app/tax-invoice/nfse/application/persistence/repository/nfse-repository.interface';
import type { INfseQueueProducer } from 'src/app/tax-invoice/nfse/application/queue/nfse-queue-producer.interface';
import { Nfse, NfseProps } from 'src/app/tax-invoice/nfse/domain/entities/nfse.entity';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { NfseAlreadyIssuedAtProviderError } from 'src/app/tax-invoice/nfse/domain/errors/nfse-already-issued-at-provider.error';
import { NfseBatchStillProcessingError } from 'src/app/tax-invoice/nfse/domain/errors/nfse-batch-still-processing.error';
import { NfseNotReissuableError } from 'src/app/tax-invoice/nfse/domain/errors/nfse-not-reissuable.error';
import { NfseProviderQueryInconclusiveError } from 'src/app/tax-invoice/nfse/domain/errors/nfse-provider-query-inconclusive.error';
import { NfseFactory } from 'src/app/tax-invoice/nfse/domain/factories/nfse.factory';
import { TOKENS } from 'src/core/di/token';
import type { ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { Nfm } from '../../../domain/entities/nfm.entity';
import { NfmNfseMissingError } from '../../../domain/errors/nfm-nfse-missing.error';
import { NfmNotFoundError } from '../../../domain/errors/nfm-not-found.error';
import { NfmFactory } from '../../../domain/factories/nfm.factory';
import type { INfmRepository } from '../../persistence/repository/nfm-repository.interface';
import { ReissueNfm } from './reissue-nfm.service';

const INPUT = { reason: 'cadastro do tomador corrigido', confirm: true };

function makeNfseProps(overrides: Partial<NfseProps> = {}): NfseProps {
  return {
    id: 99,
    companyId: 1,
    clientId: 1,
    rpsNumber: 41,
    rpsSeries: 'NFSE',
    status: NfseStatus.REJECTED,
    batchProtocol: null,
    nfseNumber: null,
    verificationCode: null,
    issuedAt: null,
    errorMessage: 'E163: CNPJ do tomador inválido',
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

describe('ReissueNfm - Unit tests', () => {
  let sut: ReissueNfm;
  let nfmRepository: INfmRepository;
  let nfseRepository: INfseRepository;
  let queueProducer: INfseQueueProducer;
  let reconcileNfse: ReconcileNfse;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        ReissueNfm,
        { provide: TOKENS.NfmRepository, useValue: createMock<INfmRepository>() },
        { provide: TOKENS.NfseRepository, useValue: createMock<INfseRepository>() },
        { provide: TOKENS.NfseQueueProducer, useValue: createMock<INfseQueueProducer>() },
        { provide: TOKENS.LoggerGateway, useValue: createMock<ILoggerGateway>() },
        { provide: ReconcileNfse, useValue: createMock<ReconcileNfse>() },
      ],
    }).compile();

    sut = module.get(ReissueNfm);
    nfmRepository = module.get(TOKENS.NfmRepository);
    nfseRepository = module.get(TOKENS.NfseRepository);
    queueProducer = module.get(TOKENS.NfseQueueProducer);
    reconcileNfse = module.get(ReconcileNfse);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw when the nfm does not exist', async() => {
    // Arrange
    jest.spyOn(nfmRepository, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(10, INPUT)).rejects.toThrow(NfmNotFoundError);
  });

  it('should throw when the nfm has no linked nfse', async() => {
    // Arrange
    jest.spyOn(nfmRepository, 'findById').mockResolvedValue(makeNfm(null));

    // Act & Assert
    await expect(sut.execute(10, INPUT)).rejects.toThrow(NfmNfseMissingError);
  });

  it.each([
    NfseStatus.ISSUED,
    NfseStatus.CANCELED,
    NfseStatus.PENDING,
    NfseStatus.SUBMITTED,
    NfseStatus.PROCESSING,
  ])(
    'should refuse to reissue a %s nfse without touching the provider',
    async(status) => {
      // Arrange — emitida, cancelada ou ainda em andamento: nada a reemitir.
      jest.spyOn(nfmRepository, 'findById').mockResolvedValue(makeNfm(NfseFactory.load(makeNfseProps({ status }))));

      // Act & Assert
      await expect(sut.execute(10, INPUT)).rejects.toThrow(NfseNotReissuableError);
      expect(reconcileNfse.execute).not.toHaveBeenCalled();
    },
  );

  it('should consult the provider itself before deciding', async() => {
    // Arrange — não basta o operador dizer que consultou: a rota consulta.
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfmRepository, 'findById').mockResolvedValue(makeNfm(nfse));
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(reconcileNfse, 'execute').mockResolvedValue({
      nfseId: 99,
      previousStatus: NfseStatus.REJECTED,
      newStatus: NfseStatus.REJECTED,
      source: ReconcileNfseSource.ProviderNotFound,
    });

    // Act
    await sut.execute(10, INPUT);

    // Assert
    expect(reconcileNfse.execute).toHaveBeenCalledWith({ nfseId: 99 });
  });

  it('should refuse and reconcile when the provider already has the note', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfmRepository, 'findById').mockResolvedValue(makeNfm(nfse));
    jest.spyOn(reconcileNfse, 'execute').mockResolvedValue({
      nfseId: 99,
      previousStatus: NfseStatus.AWAITING_PROVIDER,
      newStatus: NfseStatus.ISSUED,
      source: ReconcileNfseSource.ProviderIssued,
      nfseNumber: '12345',
    });

    // Act & Assert — reemitir sobre uma nota existente é o único erro irreversível deste fluxo.
    await expect(sut.execute(10, INPUT)).rejects.toThrow(NfseAlreadyIssuedAtProviderError);
    expect(queueProducer.addIssueBatchJob).not.toHaveBeenCalled();
  });

  it('should refuse while the batch is still in flight', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps({ status: NfseStatus.AWAITING_PROVIDER, batchProtocol: 'PROTO-1' }));
    jest.spyOn(nfmRepository, 'findById').mockResolvedValue(makeNfm(nfse));
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(reconcileNfse, 'execute').mockResolvedValue({
      nfseId: 99,
      previousStatus: NfseStatus.AWAITING_PROVIDER,
      newStatus: NfseStatus.AWAITING_PROVIDER,
      source: ReconcileNfseSource.ProviderNotFoundPolling,
    });

    // Act & Assert
    await expect(sut.execute(10, INPUT)).rejects.toThrow(NfseBatchStillProcessingError);
    expect(queueProducer.addIssueBatchJob).not.toHaveBeenCalled();
  });

  it('should refuse when the provider query was inconclusive', async() => {
    // Arrange — sem resposta sobre a existência da nota, reenviar é apostar contra uma nota emitida.
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfmRepository, 'findById').mockResolvedValue(makeNfm(nfse));
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(reconcileNfse, 'execute').mockResolvedValue({
      nfseId: 99,
      previousStatus: NfseStatus.REJECTED,
      newStatus: NfseStatus.AWAITING_PROVIDER,
      source: ReconcileNfseSource.ProviderQueryFailed,
      message: 'E4: Inscrição municipal inválida',
    });

    // Act & Assert
    await expect(sut.execute(10, INPUT)).rejects.toThrow(NfseProviderQueryInconclusiveError);
    expect(queueProducer.addIssueBatchJob).not.toHaveBeenCalled();
  });

  it('should reuse the reserved RPS when the provider does not know a REJECTED note', async() => {
    // Arrange — E212 com protocolo tombstone: reconcile deixa REJECTED; reissue é quem reseta.
    const nfse = NfseFactory.load(makeNfseProps({ batchProtocol: 'PROTO-VELHO' }));
    jest.spyOn(nfmRepository, 'findById').mockResolvedValue(makeNfm(nfse));
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(reconcileNfse, 'execute').mockResolvedValue({
      nfseId: 99,
      previousStatus: NfseStatus.REJECTED,
      newStatus: NfseStatus.REJECTED,
      source: ReconcileNfseSource.ProviderNotFound,
    });

    // Act
    const result = await sut.execute(10, INPUT);

    // Assert
    expect(nfse.props).toMatchObject({ status: NfseStatus.PENDING, batchProtocol: null, rpsNumber: 41 });
    expect(queueProducer.addIssueBatchJob).toHaveBeenCalledWith({ nfseId: 99 });
    expect(result.status).toBe(NfseStatus.PENDING);
  });

  it('should reuse the reserved RPS when the provider does not know a FAILED note', async() => {
    // Arrange — configuração corrigida (caminho do certificado, senha, municipioSlug) e a nota
    // presa em FAILED. Sem esta saída a NFM ficava inalcançável: o fechamento diário a pula porque
    // `hasNfse()` continua verdadeiro, e nenhuma varredura devolve FAILED ao início do fluxo.
    const nfse = NfseFactory.load(makeNfseProps({ status: NfseStatus.FAILED, batchProtocol: null }));
    jest.spyOn(nfmRepository, 'findById').mockResolvedValue(makeNfm(nfse));
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(reconcileNfse, 'execute').mockResolvedValue({
      nfseId: 99,
      previousStatus: NfseStatus.FAILED,
      newStatus: NfseStatus.FAILED,
      source: ReconcileNfseSource.ProviderNotFound,
    });

    // Act
    const result = await sut.execute(10, INPUT);

    // Assert — o mesmo RPS volta para a fila; um número novo é o que produziria a segunda NFS-e.
    expect(reconcileNfse.execute).toHaveBeenCalledWith({ nfseId: 99 });
    expect(nfse.props).toMatchObject({ status: NfseStatus.PENDING, batchProtocol: null, rpsNumber: 41 });
    expect(queueProducer.addIssueBatchJob).toHaveBeenCalledWith({ nfseId: 99 });
    expect(result.status).toBe(NfseStatus.PENDING);
  });

  it('should refuse a FAILED note the provider turns out to have issued', async() => {
    // Arrange — FAILED mentiroso: a nota existe no Giss. Reenviar aqui seria a segunda NFS-e.
    const nfse = NfseFactory.load(makeNfseProps({ status: NfseStatus.FAILED }));
    jest.spyOn(nfmRepository, 'findById').mockResolvedValue(makeNfm(nfse));
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(reconcileNfse, 'execute').mockResolvedValue({
      nfseId: 99,
      previousStatus: NfseStatus.FAILED,
      newStatus: NfseStatus.ISSUED,
      source: ReconcileNfseSource.ProviderIssued,
      nfseNumber: '56037',
    });

    // Act & Assert
    await expect(sut.execute(10, INPUT)).rejects.toThrow(NfseAlreadyIssuedAtProviderError);
    expect(queueProducer.addIssueBatchJob).not.toHaveBeenCalled();
  });

  it('should not enqueue twice when the reconciliation already resent the RPS', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps({ status: NfseStatus.PENDING }));
    jest.spyOn(nfmRepository, 'findById').mockResolvedValue(
      makeNfm(NfseFactory.load(makeNfseProps({ status: NfseStatus.AWAITING_PROVIDER }))),
    );
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(reconcileNfse, 'execute').mockResolvedValue({
      nfseId: 99,
      previousStatus: NfseStatus.AWAITING_PROVIDER,
      newStatus: NfseStatus.PENDING,
      source: ReconcileNfseSource.ProviderNotFoundRequeued,
    });

    // Act
    const result = await sut.execute(10, INPUT);

    // Assert
    expect(queueProducer.addIssueBatchJob).not.toHaveBeenCalled();
    expect(result.status).toBe(NfseStatus.PENDING);
  });

  it('should refuse when the reconciliation reports there was nothing to do', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps({ status: NfseStatus.REJECTED }));
    jest.spyOn(nfmRepository, 'findById').mockResolvedValue(makeNfm(nfse));
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(NfseFactory.load(makeNfseProps({ status: NfseStatus.ISSUED })));
    jest.spyOn(reconcileNfse, 'execute').mockResolvedValue({
      nfseId: 99,
      previousStatus: NfseStatus.ISSUED,
      newStatus: NfseStatus.ISSUED,
      source: ReconcileNfseSource.NoOp,
    });

    // Act & Assert
    await expect(sut.execute(10, INPUT)).rejects.toThrow(NfseNotReissuableError);
  });
});
