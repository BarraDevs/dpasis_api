import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { NfsBatchSituation } from 'src/infra/nfs-generation/dtos/nfs-batch-status.dto';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import type { INfsGenerationGateway } from 'src/infra/nfs-generation/nfs-generation.gateway';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { CompanyNfsConfigDto } from 'src/app/company/company-nfs-config/application/dtos/company-nfs-config.dto';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { CompanyNfsConfigNotFoundError } from 'src/app/company/company-nfs-config/domain/errors/company-nfs-config-not-found.error';
import { NfseDto } from '../../dtos/nfse.dto';
import type { INfseDao } from '../../persistence/dao/nfse-dao.interface';
import type { INfseQueueProducer } from '../../queue/nfse-queue-producer.interface';
import { ProcessPollNfseBatch } from './process-poll-nfse-batch.service';

function makeNfseDto(overrides: Partial<NfseDto> = {}): NfseDto {
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
    data: { providerDocument: '12345678000199' },
    createdAt: new Date(),
    updatedAt: new Date(),
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
  let nfseDao: INfseDao;
  let findCompanyNfsConfigByCompanyId: FindCompanyNfsConfigByCompanyId;
  let nfsGenerationGateway: INfsGenerationGateway;
  let queueProducer: INfseQueueProducer;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        ProcessPollNfseBatch,
        { provide: TOKENS.LoggerGateway, useValue: createMock<ILoggerGateway>() },
        { provide: TOKENS.NfseDao, useValue: createMock<INfseDao>() },
        { provide: FindCompanyNfsConfigByCompanyId, useValue: createMock<FindCompanyNfsConfigByCompanyId>() },
        { provide: TOKENS.NfsGenerationGateway, useValue: createMock<INfsGenerationGateway>() },
        { provide: TOKENS.NfseQueueProducer, useValue: createMock<INfseQueueProducer>() },
      ],
    }).compile();

    sut = module.get(ProcessPollNfseBatch);
    logger = module.get(TOKENS.LoggerGateway);
    nfseDao = module.get(TOKENS.NfseDao);
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
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute({ nfseId: 1, attempt: 1 })).rejects.toThrow(NfseNotFoundError);
  });

  it('should be a no-op when the nfse is already ISSUED', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(makeNfseDto({ status: NfseStatus.ISSUED }));

    // Act
    await sut.execute({ nfseId: 1, attempt: 1 });

    // Assert
    expect(nfsGenerationGateway.getBatchStatus).not.toHaveBeenCalled();
    expect(nfseDao.updateStatus).not.toHaveBeenCalled();
  });

  it('should be a no-op when the nfse is already FAILED', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(makeNfseDto({ status: NfseStatus.FAILED }));

    // Act
    await sut.execute({ nfseId: 1, attempt: 1 });

    // Assert
    expect(nfsGenerationGateway.getBatchStatus).not.toHaveBeenCalled();
    expect(nfseDao.updateStatus).not.toHaveBeenCalled();
  });

  it('should be a no-op when the nfse has no batchProtocol', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(makeNfseDto({ batchProtocol: null }));

    // Act
    await sut.execute({ nfseId: 1, attempt: 1 });

    // Assert
    expect(nfsGenerationGateway.getBatchStatus).not.toHaveBeenCalled();
    expect(nfseDao.updateStatus).not.toHaveBeenCalled();
  });

  it('should throw CompanyNfsConfigNotFoundError when the company has no provider config', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(makeNfseDto());
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockRejectedValue(new CompanyNfsConfigNotFoundError());

    // Act & Assert
    await expect(sut.execute({ nfseId: 1, attempt: 1 })).rejects.toThrow(CompanyNfsConfigNotFoundError);
  });

  it('should mark the nfse ISSUED when Giss reports success', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(makeNfseDto());
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
    expect(nfseDao.updateStatus).toHaveBeenCalledWith(1, expect.objectContaining({
      status: NfseStatus.ISSUED,
      nfseNumber: '1000',
      verificationCode: 'ABC123',
    }));
    expect(queueProducer.addPollBatchJob).not.toHaveBeenCalled();
  });

  it('should mark the nfse FAILED when Giss reports an error', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(makeNfseDto());
    jest.spyOn(nfsGenerationGateway, 'getBatchStatus').mockResolvedValue({
      situation: NfsBatchSituation.Error,
      errors: [{ code: 'E01', message: 'RPS inválido' }],
    });

    // Act
    await sut.execute({ nfseId: 1, attempt: 1 });

    // Assert
    expect(nfseDao.updateStatus).toHaveBeenCalledWith(1, expect.objectContaining({
      status: NfseStatus.FAILED,
      errorMessage: expect.stringContaining('RPS inválido'),
    }));
    expect(queueProducer.addPollBatchJob).not.toHaveBeenCalled();
  });

  it('should reschedule the poll job when the batch is still pending', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(makeNfseDto());
    jest.spyOn(nfsGenerationGateway, 'getBatchStatus').mockResolvedValue({ situation: NfsBatchSituation.Pending });

    // Act
    await sut.execute({ nfseId: 1, attempt: 1 });

    // Assert
    expect(nfseDao.updateStatus).toHaveBeenCalledWith(1, { status: NfseStatus.PROCESSING });
    expect(queueProducer.addPollBatchJob).toHaveBeenCalledWith(
      { nfseId: 1, attempt: 2 },
      { delayMs: 30_000 },
    );
  });

  it('should reschedule the poll job when the batch was not received yet', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(makeNfseDto());
    jest.spyOn(nfsGenerationGateway, 'getBatchStatus').mockResolvedValue({ situation: NfsBatchSituation.NotReceived });

    // Act
    await sut.execute({ nfseId: 1, attempt: 1 });

    // Assert
    expect(nfseDao.updateStatus).toHaveBeenCalledWith(1, { status: NfseStatus.PROCESSING });
    expect(queueProducer.addPollBatchJob).toHaveBeenCalledWith(
      { nfseId: 1, attempt: 2 },
      { delayMs: 30_000 },
    );
  });

  it('should mark the nfse FAILED when Giss reports success without issued notes', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(makeNfseDto());
    jest.spyOn(nfsGenerationGateway, 'getBatchStatus').mockResolvedValue({
      situation: NfsBatchSituation.Success,
      issuedNotes: [],
    });

    // Act
    await sut.execute({ nfseId: 1, attempt: 1 });

    // Assert
    expect(nfseDao.updateStatus).toHaveBeenCalledWith(1, {
      status: NfseStatus.FAILED,
      errorMessage: 'Giss retornou sucesso na consulta do lote, mas sem dados da NFS-e emitida',
    });
    expect(queueProducer.addPollBatchJob).not.toHaveBeenCalled();
  });

  it('should reschedule the poll job when the gateway call fails before max attempts', async() => {
    // Arrange
    const gatewayError = new Error('Giss indisponível');
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(makeNfseDto());
    jest.spyOn(nfsGenerationGateway, 'getBatchStatus').mockRejectedValue(gatewayError);
    const loggerSpy = jest.spyOn(logger, 'error');

    // Act
    await sut.execute({ nfseId: 1, attempt: 1 });

    // Assert
    expect(loggerSpy).toHaveBeenCalledWith(LogContext.NFS_GENERATION, {
      adapter: 'nfse',
      action: 'processPollNfseBatch',
      batchProtocol: 'protocol-123',
      error: gatewayError,
    });
    expect(nfseDao.updateStatus).toHaveBeenCalledWith(1, { status: NfseStatus.PROCESSING });
    expect(queueProducer.addPollBatchJob).toHaveBeenCalledWith(
      { nfseId: 1, attempt: 2 },
      { delayMs: 30_000 },
    );
  });

  it('should mark the nfse FAILED when the gateway call fails at max attempts', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(makeNfseDto());
    jest.spyOn(nfsGenerationGateway, 'getBatchStatus').mockRejectedValue(new Error('Giss indisponível'));

    // Act
    await sut.execute({ nfseId: 1, attempt: 10 });

    // Assert
    expect(nfseDao.updateStatus).toHaveBeenCalledWith(1, {
      status: NfseStatus.FAILED,
      errorMessage: 'Erro ao consultar status do lote no Giss',
    });
    expect(queueProducer.addPollBatchJob).not.toHaveBeenCalled();
  });

  it('should mark the nfse FAILED after exceeding the max poll attempts', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(makeNfseDto());
    jest.spyOn(nfsGenerationGateway, 'getBatchStatus').mockResolvedValue({ situation: NfsBatchSituation.Pending });

    // Act
    await sut.execute({ nfseId: 1, attempt: 10 });

    // Assert
    expect(nfseDao.updateStatus).toHaveBeenCalledWith(1, expect.objectContaining({ status: NfseStatus.FAILED }));
    expect(queueProducer.addPollBatchJob).not.toHaveBeenCalled();
  });
});
