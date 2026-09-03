import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CompanyNfsConfigDto } from 'src/app/company/company-nfs-config/application/dtos/company-nfs-config.dto';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { CompanyNfsConfigNotFoundError } from 'src/app/company/company-nfs-config/domain/errors/company-nfs-config-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { NfsBatchErrorKind, NfsBatchSituation } from 'src/infra/nfs-generation/dtos/nfs-batch-status.dto';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import type { INfsGenerationGateway } from 'src/infra/nfs-generation/nfs-generation.gateway';
import { NfseProps } from '../../../domain/entities/nfse.entity';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { NfseFactory } from '../../../domain/factories/nfse.factory';
import type { INfseRepository } from '../../persistence/repository/nfse-repository.interface';
import type { INfseQueueProducer } from '../../queue/nfse-queue-producer.interface';
import { ProcessPollNfseBatch } from './process-poll-nfse-batch.service';

function makeNfseProps(overrides: Partial<NfseProps> = {}): NfseProps {
  return {
    id: 1,
    companyId: 1,
    clientId: 1,
    rpsNumber: 7,
    rpsSeries: 'NFSE',
    status: NfseStatus.SUBMITTED,
    batchProtocol: 'protocol-123',
    nfseNumber: null,
    verificationCode: null,
    issuedAt: null,
    errorMessage: null,
    canceledAt: null,
    cancelReasonCode: null,
    bankPaymentProvider: null,
    bankPaymentRequestCode: null,
    data: { providerDocument: '12345678000199' },
    ...overrides,
  };
}

const providerConfig = createMock<CompanyNfsConfigDto>({
  certFilePath: '/certs/x.pfx',
  certPasswordEnvVar: 'X_PASS',
  environment: NfsProviderEnvironment.Demonstration,
  vendorConfig: { municipioSlug: 'demonstracao' },
});

describe('ProcessPollNfseBatch - Unit tests', () => {
  let sut: ProcessPollNfseBatch;
  let logger: ILoggerGateway;
  let nfseRepository: INfseRepository;
  let findCompanyNfsConfigByCompanyId: FindCompanyNfsConfigByCompanyId;
  let nfsGenerationGateway: INfsGenerationGateway;
  let queueProducer: INfseQueueProducer;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        ProcessPollNfseBatch,
        { provide: TOKENS.LoggerGateway, useValue: createMock<ILoggerGateway>() },
        { provide: TOKENS.NfseRepository, useValue: createMock<INfseRepository>() },
        { provide: FindCompanyNfsConfigByCompanyId, useValue: createMock<FindCompanyNfsConfigByCompanyId>() },
        { provide: TOKENS.NfsGenerationGateway, useValue: createMock<INfsGenerationGateway>() },
        { provide: TOKENS.NfseQueueProducer, useValue: createMock<INfseQueueProducer>() },
      ],
    }).compile();

    sut = module.get(ProcessPollNfseBatch);
    logger = module.get(TOKENS.LoggerGateway);
    nfseRepository = module.get(TOKENS.NfseRepository);
    findCompanyNfsConfigByCompanyId = module.get(FindCompanyNfsConfigByCompanyId);
    nfsGenerationGateway = module.get(TOKENS.NfsGenerationGateway);
    queueProducer = module.get(TOKENS.NfseQueueProducer);

    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw NfseNotFoundError when the nfse does not exist', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute({ nfseId: 1, attempt: 1 })).rejects.toThrow(NfseNotFoundError);
  });

  it('should be a no-op when the nfse is already ISSUED', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(
      NfseFactory.load(makeNfseProps({ status: NfseStatus.ISSUED })),
    );

    // Act
    await sut.execute({ nfseId: 1, attempt: 1 });

    // Assert
    expect(nfsGenerationGateway.getBatchStatus).not.toHaveBeenCalled();
    expect(nfseRepository.edit).not.toHaveBeenCalled();
  });

  it('should be a no-op when the nfse is already FAILED', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(
      NfseFactory.load(makeNfseProps({ status: NfseStatus.FAILED })),
    );

    // Act
    await sut.execute({ nfseId: 1, attempt: 1 });

    // Assert
    expect(nfsGenerationGateway.getBatchStatus).not.toHaveBeenCalled();
    expect(nfseRepository.edit).not.toHaveBeenCalled();
  });

  it('should be a no-op when the nfse has no batchProtocol', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(
      NfseFactory.load(makeNfseProps({ batchProtocol: null })),
    );

    // Act
    await sut.execute({ nfseId: 1, attempt: 1 });

    // Assert
    expect(nfsGenerationGateway.getBatchStatus).not.toHaveBeenCalled();
    expect(nfseRepository.edit).not.toHaveBeenCalled();
  });

  it('should throw CompanyNfsConfigNotFoundError when the company has no provider config', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(NfseFactory.load(makeNfseProps()));
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockRejectedValue(new CompanyNfsConfigNotFoundError());

    // Act & Assert
    await expect(sut.execute({ nfseId: 1, attempt: 1 })).rejects.toThrow(CompanyNfsConfigNotFoundError);
  });

  it('should mark the nfse ISSUED when Giss reports success', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(nfsGenerationGateway, 'getBatchStatus').mockResolvedValue({
      situation: NfsBatchSituation.Success,
      issuedNotes: [{
        rpsNumber: 7,
        rpsSeries: 'NFSE',
        nfseNumber: '1000',
        verificationCode: 'ABC123',
        issueDate: '2026-07-20T10:00:00',
      }],
    });

    // Act
    await sut.execute({ nfseId: 1, attempt: 1 });

    // Assert
    expect(nfseRepository.edit).toHaveBeenCalledWith(nfse);
    expect(nfse.props).toMatchObject({
      status: NfseStatus.ISSUED,
      nfseNumber: '1000',
      verificationCode: 'ABC123',
    });
    expect(queueProducer.addPollBatchJob).not.toHaveBeenCalled();
    expect(queueProducer.addIssueBankPaymentJob).toHaveBeenCalledWith({ nfseId: 1 });
  });

  it('should mark the nfse FAILED when the provider reports an error', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(nfsGenerationGateway, 'getBatchStatus').mockResolvedValue({
      situation: NfsBatchSituation.Error,
      errors: [{ code: 'E01', message: 'RPS inválido', kind: NfsBatchErrorKind.BusinessRejection }],
    });

    // Act
    await sut.execute({ nfseId: 1, attempt: 1 });

    // Assert
    expect(nfseRepository.edit).toHaveBeenCalledWith(nfse);
    expect(nfse.props.status).toBe(NfseStatus.FAILED);
    expect(nfse.props.errorMessage).toContain('RPS inválido');
    expect(queueProducer.addPollBatchJob).not.toHaveBeenCalled();
    expect(queueProducer.addIssueBankPaymentJob).not.toHaveBeenCalled();
  });

  it('should reschedule the poll job when the batch is still pending', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(nfsGenerationGateway, 'getBatchStatus').mockResolvedValue({ situation: NfsBatchSituation.Pending });

    // Act
    await sut.execute({ nfseId: 1, attempt: 1 });

    // Assert
    expect(nfseRepository.edit).toHaveBeenCalledWith(nfse);
    expect(nfse.props.status).toBe(NfseStatus.PROCESSING);
    expect(queueProducer.addPollBatchJob).toHaveBeenCalledWith(
      { nfseId: 1, attempt: 2 },
      { delayMs: 30_000 },
    );
  });

  it('should reschedule the poll job when the batch was not received yet', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(nfsGenerationGateway, 'getBatchStatus').mockResolvedValue({ situation: NfsBatchSituation.NotReceived });

    // Act
    await sut.execute({ nfseId: 1, attempt: 1 });

    // Assert
    expect(nfseRepository.edit).toHaveBeenCalledWith(nfse);
    expect(nfse.props.status).toBe(NfseStatus.PROCESSING);
    expect(queueProducer.addPollBatchJob).toHaveBeenCalledWith(
      { nfseId: 1, attempt: 2 },
      { delayMs: 30_000 },
    );
  });

  it('should park the nfse in AWAITING_PROVIDER when Giss reports success without issued notes', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(nfsGenerationGateway, 'getBatchStatus').mockResolvedValue({
      situation: NfsBatchSituation.Success,
      issuedNotes: [],
    });

    // Act
    await sut.execute({ nfseId: 1, attempt: 1 });

    // Assert
    expect(nfseRepository.edit).toHaveBeenCalledWith(nfse);
    expect(nfse.props).toMatchObject({
      status: NfseStatus.AWAITING_PROVIDER,
      errorMessage: 'Giss retornou sucesso na consulta do lote, mas sem dados da NFS-e emitida',
    });
    expect(queueProducer.addPollBatchJob).not.toHaveBeenCalled();
    expect(queueProducer.addIssueBankPaymentJob).not.toHaveBeenCalled();
  });

  it('should reschedule the poll job when the gateway call fails before max attempts', async() => {
    // Arrange
    const gatewayError = new Error('Giss indisponível');
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(nfsGenerationGateway, 'getBatchStatus').mockRejectedValue(gatewayError);
    const loggerSpy = jest.spyOn(logger, 'error');

    // Act
    await sut.execute({ nfseId: 1, attempt: 1 });

    // Assert
    expect(loggerSpy).toHaveBeenCalledWith(LogContext.NFS_GENERATION, {
      adapter: 'nfse',
      action: 'processPollNfseBatch',
      nfseId: 1,
      batchProtocol: 'protocol-123',
      error: gatewayError,
    });
    expect(nfseRepository.edit).toHaveBeenCalledWith(nfse);
    expect(nfse.props.status).toBe(NfseStatus.PROCESSING);
    expect(queueProducer.addPollBatchJob).toHaveBeenCalledWith(
      { nfseId: 1, attempt: 2 },
      { delayMs: 30_000 },
    );
  });

  it('should park the nfse in AWAITING_PROVIDER when the gateway call fails after the last ladder step', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(nfsGenerationGateway, 'getBatchStatus').mockRejectedValue(new Error('Giss indisponível'));

    // Act
    await sut.execute({ nfseId: 1, attempt: 8 });

    // Assert
    expect(nfseRepository.edit).toHaveBeenCalledWith(nfse);
    expect(nfse.props).toMatchObject({
      status: NfseStatus.AWAITING_PROVIDER,
      errorMessage: 'Erro ao consultar status do lote no Giss: Giss indisponível',
    });
    expect(queueProducer.addPollBatchJob).not.toHaveBeenCalled();
  });

  it('should park the nfse in AWAITING_PROVIDER after exhausting the poll ladder', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(nfsGenerationGateway, 'getBatchStatus').mockResolvedValue({ situation: NfsBatchSituation.Pending });

    // Act
    await sut.execute({ nfseId: 1, attempt: 8 });

    // Assert
    expect(nfseRepository.edit).toHaveBeenCalledWith(nfse);
    expect(nfse.props.status).toBe(NfseStatus.AWAITING_PROVIDER);
    expect(queueProducer.addPollBatchJob).not.toHaveBeenCalled();
  });

  it.each([
    [1, 30_000],
    [2, 60_000],
    [3, 300_000],
    [4, 900_000],
    [5, 3_600_000],
    [6, 21_600_000],
    [7, 86_400_000],
  ])('should schedule attempt %i of the ladder with a %i ms delay', async(attempt, expectedDelayMs) => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(nfsGenerationGateway, 'getBatchStatus').mockResolvedValue({ situation: NfsBatchSituation.Pending });

    // Act
    await sut.execute({ nfseId: 1, attempt });

    // Assert
    expect(queueProducer.addPollBatchJob).toHaveBeenCalledWith(
      { nfseId: 1, attempt: attempt + 1 },
      { delayMs: expectedDelayMs },
    );
  });

  it('should keep marking the nfse FAILED when the provider rejects the batch for a business reason', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(nfsGenerationGateway, 'getBatchStatus').mockResolvedValue({
      situation: NfsBatchSituation.Error,
      errors: [{ code: 'E202', message: 'Código de tributação não informado', kind: NfsBatchErrorKind.BusinessRejection }],
    });

    // Act
    await sut.execute({ nfseId: 1, attempt: 1 });

    // Assert
    expect(nfse.props).toMatchObject({
      status: NfseStatus.FAILED,
      errorMessage: 'E202: Código de tributação não informado',
    });
  });

  it('should park the nfse in AWAITING_PROVIDER when the provider reports already submitted', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(nfsGenerationGateway, 'getBatchStatus').mockResolvedValue({
      situation: NfsBatchSituation.Error,
      errors: [
        { code: 'A9', message: 'Inscrição municipal incorreta.', kind: NfsBatchErrorKind.BusinessRejection },
        // code is opaque — use case must branch on kind, not vendor code
        { code: 'X', message: 'RPS já informado.', kind: NfsBatchErrorKind.AlreadySubmitted },
      ],
    });

    // Act
    await sut.execute({ nfseId: 1, attempt: 1 });

    // Assert
    expect(nfse.props.status).toBe(NfseStatus.AWAITING_PROVIDER);
    expect(queueProducer.addPollBatchJob).not.toHaveBeenCalled();
  });
});
