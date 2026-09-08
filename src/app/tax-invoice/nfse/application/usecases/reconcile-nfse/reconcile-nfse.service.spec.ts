import { createMock } from '@golevelup/ts-jest';
import { RecordJobAudit } from 'src/app/audit/application/usecases/record-job-audit/record-job-audit.service';
import { Test } from '@nestjs/testing';
import { CompanyNfsConfigDto } from 'src/app/company/company-nfs-config/application/dtos/company-nfs-config.dto';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { TOKENS } from 'src/core/di/token';
import type { ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { NfsBatchErrorKind } from 'src/infra/nfs-generation/dtos/nfs-batch-status.dto';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import type { INfsGenerationGateway } from 'src/infra/nfs-generation/nfs-generation.gateway';
import { NfseProps } from '../../../domain/entities/nfse.entity';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { NfseFactory } from '../../../domain/factories/nfse.factory';
import type { INfseRepository } from '../../persistence/repository/nfse-repository.interface';
import type { INfseQueueProducer } from '../../queue/nfse-queue-producer.interface';
import { ReconcileNfseSource } from './dtos/reconcile-nfse.dto';
import { ReconcileNfse } from './reconcile-nfse.service';

function makeNfseProps(overrides: Partial<NfseProps> = {}): NfseProps {
  return {
    id: 1,
    companyId: 1,
    clientId: 1,
    rpsNumber: 41,
    rpsSeries: 'NFSE',
    status: NfseStatus.AWAITING_PROVIDER,
    batchProtocol: null,
    nfseNumber: null,
    verificationCode: null,
    issuedAt: null,
    errorMessage: 'timeout na recepção',
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
    nextReconcileAt: new Date('2026-09-04T00:00:00Z'),
    createdAt: new Date('2026-09-01T12:00:00Z'),
    nfmId: 500,
    data: { providerDocument: '12345678000199' },
    ...overrides,
  };
}

const providerConfig = createMock<CompanyNfsConfigDto>({
  certFilePath: '/certs/x.pfx',
  certPasswordEnvVar: 'X_PASS',
  environment: NfsProviderEnvironment.Demonstration,
  municipalRegistration: '16895',
  vendorConfig: { municipioSlug: 'demonstracao' },
});

const issuedNote = {
  rpsNumber: 41,
  rpsSeries: 'NFSE',
  nfseNumber: '12345',
  verificationCode: 'ABC123',
  issueDate: '2026-09-01T14:00:00',
};

describe('ReconcileNfse - Unit tests', () => {
  let sut: ReconcileNfse;
  let nfseRepository: INfseRepository;
  let nfsGenerationGateway: INfsGenerationGateway;
  let queueProducer: INfseQueueProducer;
  let findCompanyNfsConfigByCompanyId: FindCompanyNfsConfigByCompanyId;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        ReconcileNfse,
        { provide: TOKENS.LoggerGateway, useValue: createMock<ILoggerGateway>() },
        { provide: TOKENS.NfseRepository, useValue: createMock<INfseRepository>() },
        { provide: TOKENS.NfsGenerationGateway, useValue: createMock<INfsGenerationGateway>() },
        { provide: TOKENS.NfseQueueProducer, useValue: createMock<INfseQueueProducer>() },
        { provide: FindCompanyNfsConfigByCompanyId, useValue: createMock<FindCompanyNfsConfigByCompanyId>() },
        { provide: RecordJobAudit, useValue: createMock<RecordJobAudit>() },
      ],
    }).compile();

    sut = module.get(ReconcileNfse);
    nfseRepository = module.get(TOKENS.NfseRepository);
    nfsGenerationGateway = module.get(TOKENS.NfsGenerationGateway);
    queueProducer = module.get(TOKENS.NfseQueueProducer);
    findCompanyNfsConfigByCompanyId = module.get(FindCompanyNfsConfigByCompanyId);

    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw when the nfse does not exist', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute({ nfseId: 1 })).rejects.toThrow(NfseNotFoundError);
  });

  it('should query the provider by the natural RPS key, with the municipal registration', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(nfsGenerationGateway, 'findNfseByRps').mockResolvedValue({ found: false, errors: [] });

    // Act
    await sut.execute({ nfseId: 1 });

    // Assert
    expect(nfsGenerationGateway.findNfseByRps).toHaveBeenCalledWith(expect.objectContaining({
      nfseId: 1,
      rpsNumber: 41,
      rpsSeries: 'NFSE',
      providerDocument: '12345678000199',
      providerMunicipalRegistration: '16895',
    }));
  });

  describe('o provedor devolveu a nota', () => {
    it('should mark ISSUED with the provider data and enqueue the bank payment', async() => {
      // Arrange
      const nfse = NfseFactory.load(makeNfseProps());
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(nfsGenerationGateway, 'findNfseByRps').mockResolvedValue({ found: true, note: issuedNote });

      // Act
      const result = await sut.execute({ nfseId: 1 });

      // Assert
      expect(nfse.props).toMatchObject({
        status: NfseStatus.ISSUED,
        nfseNumber: '12345',
        verificationCode: 'ABC123',
      });
      expect(queueProducer.addIssueBankPaymentJob).toHaveBeenCalledWith({ nfseId: 1 });
      expect(result).toMatchObject({
        previousStatus: NfseStatus.AWAITING_PROVIDER,
        newStatus: NfseStatus.ISSUED,
        source: ReconcileNfseSource.ProviderIssued,
        nfseNumber: '12345',
      });
    });

    it('should take issuedAt from the provider, not from the clock', async() => {
      // Arrange — o prazo de cancelamento corre desde a emissão; uma nota descoberta hoje pode ter
      // sido emitida semanas atrás.
      const nfse = NfseFactory.load(makeNfseProps());
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(nfsGenerationGateway, 'findNfseByRps').mockResolvedValue({ found: true, note: issuedNote });

      // Act
      await sut.execute({ nfseId: 1 });

      // Assert
      expect(nfse.props.issuedAt).toEqual(new Date('2026-09-01T14:00:00'));
    });

    it('should stop the reconcile schedule once the note is issued', async() => {
      // Arrange
      const nfse = NfseFactory.load(makeNfseProps());
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(nfsGenerationGateway, 'findNfseByRps').mockResolvedValue({ found: true, note: issuedNote });

      // Act
      await sut.execute({ nfseId: 1 });

      // Assert
      expect(nfse.props.nextReconcileAt).toBeNull();
    });
  });

  describe('a consulta em si falhou', () => {
    it('should never mark REJECTED from a query error', async() => {
      // Arrange — a mensagem fala da consulta (inscrição municipal, prestador), não do conteúdo do
      // RPS. Marcar terminal aqui é o `FAILED` mentiroso que esta reconciliação existe para desfazer.
      const nfse = NfseFactory.load(makeNfseProps());
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(nfsGenerationGateway, 'findNfseByRps').mockResolvedValue({
        found: false,
        errors: [{ code: 'E4', message: 'Inscrição municipal inválida', kind: NfsBatchErrorKind.BusinessRejection }],
      });

      // Act
      const result = await sut.execute({ nfseId: 1 });

      // Assert
      expect(nfse.props.status).toBe(NfseStatus.AWAITING_PROVIDER);
      expect(nfse.props.errorMessage).toBe('E4: Inscrição municipal inválida');
      expect(nfse.isTerminal()).toBe(false);
      expect(result.source).toBe(ReconcileNfseSource.ProviderQueryFailed);
      expect(queueProducer.addIssueBatchJob).not.toHaveBeenCalled();
      expect(queueProducer.addPollBatchJob).not.toHaveBeenCalled();
    });

    it('should keep asking, since nobody can decide yet', async() => {
      // Arrange
      jest.useFakeTimers().setSystemTime(new Date('2026-09-04T12:00:00Z'));
      const nfse = NfseFactory.load(makeNfseProps());
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(nfsGenerationGateway, 'findNfseByRps').mockResolvedValue({
        found: false,
        errors: [{ code: 'E4', message: 'Inscrição municipal inválida', kind: NfsBatchErrorKind.BusinessRejection }],
      });

      // Act
      await sut.execute({ nfseId: 1 });

      // Assert — primeiro degrau da escada: 5min.
      expect(nfse.props.nextReconcileAt).toEqual(new Date('2026-09-04T12:05:00Z'));

      jest.useRealTimers();
    });

    it('should treat E89 as "not found", not as a rejection', async() => {
      // Arrange — medido contra produção: é assim que o Giss responde um RPS desconhecido.
      const nfse = NfseFactory.load(makeNfseProps({ batchProtocol: null }));
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(nfsGenerationGateway, 'findNfseByRps').mockResolvedValue({
        found: false,
        errors: [{ code: 'E89', message: 'E89', kind: NfsBatchErrorKind.NotFound }],
      });

      // Act
      const result = await sut.execute({ nfseId: 1 });

      // Assert
      expect(result.source).toBe(ReconcileNfseSource.ProviderNotFoundRequeued);
      expect(nfse.props.status).toBe(NfseStatus.PENDING);
    });
  });

  describe('o provedor não conhece o RPS', () => {
    it('should resend the same RPS when there is no batch protocol', async() => {
      // Arrange — o provedor confirmou que não recebeu: reenviar o MESMO RPS é seguro.
      const nfse = NfseFactory.load(makeNfseProps({ batchProtocol: null }));
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(nfsGenerationGateway, 'findNfseByRps').mockResolvedValue({
        found: false,
        errors: [{ code: 'E212', message: 'NFS-e não encontrada', kind: NfsBatchErrorKind.NotFound }],
      });

      // Act
      const result = await sut.execute({ nfseId: 1 });

      // Assert
      expect(nfse.props).toMatchObject({ status: NfseStatus.PENDING, batchProtocol: null, rpsNumber: 41 });
      expect(queueProducer.addIssueBatchJob).toHaveBeenCalledWith({ nfseId: 1 });
      expect(result.source).toBe(ReconcileNfseSource.ProviderNotFoundRequeued);
    });

    it('should reschedule the batch poll instead of resending when a protocol exists', async() => {
      // Arrange — com lote aceito, reenviar apostaria contra o lote em voo.
      const nfse = NfseFactory.load(makeNfseProps({ batchProtocol: 'PROTO-1' }));
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(nfsGenerationGateway, 'findNfseByRps').mockResolvedValue({
        found: false,
        errors: [{ code: 'E212', message: 'NFS-e não encontrada', kind: NfsBatchErrorKind.NotFound }],
      });

      // Act
      const result = await sut.execute({ nfseId: 1 });

      // Assert
      expect(nfse.props.status).toBe(NfseStatus.AWAITING_PROVIDER);
      expect(nfse.props.batchProtocol).toBe('PROTO-1');
      expect(queueProducer.addPollBatchJob).toHaveBeenCalledWith({ nfseId: 1, attempt: 1 });
      expect(queueProducer.addIssueBatchJob).not.toHaveBeenCalled();
      expect(result.source).toBe(ReconcileNfseSource.ProviderNotFoundPolling);
    });

    it.each([NfseStatus.REJECTED, NfseStatus.FAILED])(
      'should leave a %s note untouched when the provider does not know the RPS',
      async(status) => {
        // Arrange — E212 numa recusa já encerrada não é lote em voo. Inventar AWAITING_PROVIDER
        // aqui é o que trava o reissue (P1-04).
        const nfse = NfseFactory.load(makeNfseProps({
          status,
          batchProtocol: 'PROTO-VELHO',
          errorMessage: 'E163: CNPJ do tomador inválido',
          nextReconcileAt: null,
        }));
        jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
        jest.spyOn(nfsGenerationGateway, 'findNfseByRps').mockResolvedValue({
          found: false,
          errors: [{ code: 'E212', message: 'NFS-e não encontrada', kind: NfsBatchErrorKind.NotFound }],
        });

        // Act
        const result = await sut.execute({ nfseId: 1 });

        // Assert
        expect(nfse.props.status).toBe(status);
        expect(nfse.props.batchProtocol).toBe('PROTO-VELHO');
        expect(nfse.props.nextReconcileAt).toBeNull();
        expect(queueProducer.addPollBatchJob).not.toHaveBeenCalled();
        expect(queueProducer.addIssueBatchJob).not.toHaveBeenCalled();
        expect(nfseRepository.edit).not.toHaveBeenCalled();
        expect(result).toMatchObject({
          previousStatus: status,
          newStatus: status,
          source: ReconcileNfseSource.ProviderNotFound,
        });
      },
    );

    it('should climb the backoff ladder attempt by attempt', async() => {
      // Arrange
      jest.useFakeTimers().setSystemTime(new Date('2026-09-04T12:00:00Z'));
      const nfse = NfseFactory.load(makeNfseProps({ batchProtocol: 'PROTO-1', reconcileAttemptCount: 2 }));
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(nfsGenerationGateway, 'findNfseByRps').mockResolvedValue({ found: false, errors: [] });

      // Act
      await sut.execute({ nfseId: 1 });

      // Assert — terceiro degrau da escada: 1h.
      expect(nfse.props.reconcileAttemptCount).toBe(3);
      expect(nfse.props.nextReconcileAt).toEqual(new Date('2026-09-04T13:00:00Z'));

      jest.useRealTimers();
    });

    it('should fall back to a daily rhythm once the ladder is exhausted', async() => {
      // Arrange
      jest.useFakeTimers().setSystemTime(new Date('2026-09-04T12:00:00Z'));
      const nfse = NfseFactory.load(makeNfseProps({ batchProtocol: 'PROTO-1', reconcileAttemptCount: 20 }));
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(nfsGenerationGateway, 'findNfseByRps').mockResolvedValue({ found: false, errors: [] });

      // Act
      await sut.execute({ nfseId: 1 });

      // Assert
      expect(nfse.props.nextReconcileAt).toEqual(new Date('2026-09-05T12:00:00Z'));

      jest.useRealTimers();
    });

    it('should stop rescheduling past the 25-day cancellation margin', async() => {
      // Arrange — o cancelamento tem 30 dias contados da emissão; aos 25 a decisão vira humana.
      jest.useFakeTimers().setSystemTime(new Date('2026-10-01T12:00:00Z'));
      const nfse = NfseFactory.load(makeNfseProps({
        batchProtocol: 'PROTO-1',
        createdAt: new Date('2026-09-01T12:00:00Z'),
      }));
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
      jest.spyOn(nfsGenerationGateway, 'findNfseByRps').mockResolvedValue({ found: false, errors: [] });

      // Act
      await sut.execute({ nfseId: 1 });

      // Assert
      expect(nfse.props.nextReconcileAt).toBeNull();

      jest.useRealTimers();
    });
  });

  describe('nada a fazer', () => {
    it.each([NfseStatus.ISSUED, NfseStatus.CANCELED])('should not call the provider when the nfse is %s', async(status) => {
      // Arrange
      const nfse = NfseFactory.load(makeNfseProps({ status, nextReconcileAt: null }));
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);

      // Act
      const result = await sut.execute({ nfseId: 1 });

      // Assert
      expect(nfsGenerationGateway.findNfseByRps).not.toHaveBeenCalled();
      expect(nfseRepository.edit).not.toHaveBeenCalled();
      expect(result.source).toBe(ReconcileNfseSource.NoOp);
    });

    it('should clear a stale schedule left on a terminal nfse', async() => {
      // Arrange
      const nfse = NfseFactory.load(makeNfseProps({
        status: NfseStatus.ISSUED,
        nextReconcileAt: new Date('2026-09-04T00:00:00Z'),
      }));
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);

      // Act
      await sut.execute({ nfseId: 1 });

      // Assert
      expect(nfse.props.nextReconcileAt).toBeNull();
      expect(nfseRepository.edit).toHaveBeenCalledWith(nfse);
    });
  });
});
