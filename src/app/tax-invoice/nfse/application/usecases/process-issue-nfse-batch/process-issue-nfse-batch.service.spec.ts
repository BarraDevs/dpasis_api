import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import type { ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import type { INfsGenerationGateway } from 'src/infra/nfs-generation/nfs-generation.gateway';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { NfsProviderNotConfiguredError } from '../../../domain/errors/nfs-provider-not-configured.error';
import { NfseDto } from '../../dtos/nfse.dto';
import { NfsProviderConfigDto } from '../../dtos/nfs-provider-config.dto';
import type { INfsProviderConfigDao } from '../../persistence/dao/nfs-provider-config-dao.interface';
import type { INfseDao } from '../../persistence/dao/nfse-dao.interface';
import type { INfseQueueProducer } from '../../queue/nfse-queue-producer.interface';
import { NfseIssueSnapshot } from '../issue-nfse/issue-nfse.service';
import { ProcessIssueNfseBatch } from './process-issue-nfse-batch.service';

function makeNfseDto(overrides: Partial<NfseDto> = {}): NfseDto {
  const snapshot: NfseIssueSnapshot = {
    input: {
      companyId: 1,
      clientId: 1,
      simpleNationalOptant: false,
      fiscalIncentive: false,
      service: {
        serviceListItemCode: '01.07',
        nbsCode: '112731375',
        description: 'Desenvolvimento de sistema',
        serviceMunicipalCodeIbge: '3529401',
        issExigibility: 1,
        issWithheld: false,
        servicesValue: 1000,
      },
    },
    providerDocument: '12345678000199',
    providerMunicipalRegistration: '12345',
    clientDocument: '98765432000188',
    clientCompanyName: 'Cliente LTDA',
  };

  return {
    id: 1,
    companyId: 1,
    clientId: 1,
    rpsNumber: 7,
    rpsSeries: 'NFSE',
    status: NfseStatus.PENDING,
    batchProtocol: null,
    nfseNumber: null,
    verificationCode: null,
    issuedAt: null,
    errorMessage: null,
    data: snapshot as unknown as Record<string, unknown>,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('ProcessIssueNfseBatch - Unit tests', () => {
  let sut: ProcessIssueNfseBatch;
  let nfseDao: INfseDao;
  let providerConfigDao: INfsProviderConfigDao;
  let nfsGenerationGateway: INfsGenerationGateway;
  let queueProducer: INfseQueueProducer;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        ProcessIssueNfseBatch,
        { provide: TOKENS.LoggerGateway, useValue: createMock<ILoggerGateway>() },
        { provide: TOKENS.NfseDao, useValue: createMock<INfseDao>() },
        { provide: TOKENS.NfsProviderConfigDao, useValue: createMock<INfsProviderConfigDao>() },
        { provide: TOKENS.NfsGenerationGateway, useValue: createMock<INfsGenerationGateway>() },
        { provide: TOKENS.NfseQueueProducer, useValue: createMock<INfseQueueProducer>() },
      ],
    }).compile();

    sut = module.get(ProcessIssueNfseBatch);
    nfseDao = module.get(TOKENS.NfseDao);
    providerConfigDao = module.get(TOKENS.NfsProviderConfigDao);
    nfsGenerationGateway = module.get(TOKENS.NfsGenerationGateway);
    queueProducer = module.get(TOKENS.NfseQueueProducer);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw NfseNotFoundError when the nfse does not exist', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute({ nfseId: 1 })).rejects.toThrow(NfseNotFoundError);
  });

  it('should be a no-op when the nfse is already ISSUED', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(makeNfseDto({ status: NfseStatus.ISSUED }));

    // Act
    await sut.execute({ nfseId: 1 });

    // Assert
    expect(nfsGenerationGateway.issueBatch).not.toHaveBeenCalled();
  });

  it('should throw NfsProviderNotConfiguredError when the company has no provider config', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(makeNfseDto());
    jest.spyOn(providerConfigDao, 'findByCompanyId').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute({ nfseId: 1 })).rejects.toThrow(NfsProviderNotConfiguredError);
  });

  it('should mark the nfse SUBMITTED and schedule a poll job on success', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(makeNfseDto());
    jest.spyOn(providerConfigDao, 'findByCompanyId').mockResolvedValue(createMock<NfsProviderConfigDto>({
      certFilePath: '/certs/x.pfx',
      certPasswordEnvVar: 'X_PASS',
      environment: NfsProviderEnvironment.Demonstration,
      vendorConfig: { municipioSlug: 'demonstracao' },
    }));
    jest.spyOn(nfsGenerationGateway, 'issueBatch').mockResolvedValue({ batchProtocol: 'protocol-123' });

    // Act
    await sut.execute({ nfseId: 1 });

    // Assert
    expect(nfseDao.updateStatus).toHaveBeenCalledWith(1, {
      status: NfseStatus.SUBMITTED,
      batchProtocol: 'protocol-123',
    });
    expect(queueProducer.addPollBatchJob).toHaveBeenCalledWith(
      { nfseId: 1, attempt: 1 },
      expect.objectContaining({ delayMs: expect.any(Number) }),
    );
  });

  it('should mark the nfse FAILED and not schedule a poll job when the gateway call fails', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(makeNfseDto());
    jest.spyOn(providerConfigDao, 'findByCompanyId').mockResolvedValue(createMock<NfsProviderConfigDto>({
      certFilePath: '/certs/x.pfx',
      certPasswordEnvVar: 'X_PASS',
      environment: NfsProviderEnvironment.Demonstration,
      vendorConfig: { municipioSlug: 'demonstracao' },
    }));
    jest.spyOn(nfsGenerationGateway, 'issueBatch').mockRejectedValue(new Error('Giss indisponível'));

    // Act
    await sut.execute({ nfseId: 1 });

    // Assert
    expect(nfseDao.updateStatus).toHaveBeenCalledWith(1, {
      status: NfseStatus.FAILED,
      errorMessage: 'Giss indisponível',
    });
    expect(queueProducer.addPollBatchJob).not.toHaveBeenCalled();
  });
});
