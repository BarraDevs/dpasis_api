import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
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
import { NfseIssueSnapshot } from '../issue-nfse/issue-nfse.service';
import { ProcessIssueNfseBatch } from './process-issue-nfse-batch.service';

const providerConfig = createMock<CompanyNfsConfigDto>({
  certFilePath: '/certs/x.pfx',
  certPasswordEnvVar: 'X_PASS',
  environment: NfsProviderEnvironment.Demonstration,
  vendorConfig: { municipioSlug: 'demonstracao' },
});

function makeNfseDto(overrides: Partial<NfseDto> = {}): NfseDto {
  const snapshot: NfseIssueSnapshot = {
    input: {
      companyId: 1,
      clientId: 1,
      simpleNationalOptant: false,
      fiscalIncentive: false,
      service: {
        serviceListItemCode: '01.07',
        nbsCode: '1.1501.30.00',
        indopCode: '050101',
        description: 'Desenvolvimento de sistema',
        serviceMunicipalCodeIbge: '3529401',
        issExigibility: 1,
        issWithheld: true,
        issRetentionResponsible: 1,
        issValue: 50,
        servicesValue: 1000,
        cClassTrib: '000001',
        ibsCbsCst: '000',
      },
    },
    providerDocument: '12345678000199',
    providerMunicipalRegistration: '12345',
    clientDocument: '98765432000188',
    clientCompanyName: 'Cliente LTDA',
    takerAddress: {
      street: 'Av. Paulista',
      number: '500',
      complement: 'Sala 301',
      neighborhood: 'Bela Vista',
      cityCodeIbge: '3550308',
      state: 'SP',
      zipCode: '01310-100',
    },
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
    canceledAt: null,
    cancelReasonCode: null,
    data: snapshot as unknown as Record<string, unknown>,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('ProcessIssueNfseBatch - Unit tests', () => {
  let sut: ProcessIssueNfseBatch;
  let logger: ILoggerGateway;
  let nfseDao: INfseDao;
  let findCompanyNfsConfigByCompanyId: FindCompanyNfsConfigByCompanyId;
  let nfsGenerationGateway: INfsGenerationGateway;
  let queueProducer: INfseQueueProducer;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        ProcessIssueNfseBatch,
        { provide: TOKENS.LoggerGateway, useValue: createMock<ILoggerGateway>() },
        { provide: TOKENS.NfseDao, useValue: createMock<INfseDao>() },
        { provide: FindCompanyNfsConfigByCompanyId, useValue: createMock<FindCompanyNfsConfigByCompanyId>() },
        { provide: TOKENS.NfsGenerationGateway, useValue: createMock<INfsGenerationGateway>() },
        { provide: TOKENS.NfseQueueProducer, useValue: createMock<INfseQueueProducer>() },
      ],
    }).compile();

    sut = module.get(ProcessIssueNfseBatch);
    logger = module.get(TOKENS.LoggerGateway);
    nfseDao = module.get(TOKENS.NfseDao);
    findCompanyNfsConfigByCompanyId = module.get(FindCompanyNfsConfigByCompanyId);
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
    expect(nfseDao.updateStatus).not.toHaveBeenCalled();
    expect(queueProducer.addPollBatchJob).not.toHaveBeenCalled();
  });

  it('should throw CompanyNfsConfigNotFoundError when the company has no provider config', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(makeNfseDto());
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockRejectedValue(new CompanyNfsConfigNotFoundError());

    // Act & Assert
    await expect(sut.execute({ nfseId: 1 })).rejects.toThrow(CompanyNfsConfigNotFoundError);
  });

  it('should mark the nfse SUBMITTED and schedule a poll job on success', async() => {
    // Arrange
    const today = new Date().toISOString().slice(0, 10);
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(makeNfseDto());
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
    jest.spyOn(nfsGenerationGateway, 'issueBatch').mockResolvedValue({ batchProtocol: 'protocol-123' });

    // Act
    await sut.execute({ nfseId: 1 });

    // Assert
    expect(nfsGenerationGateway.issueBatch).toHaveBeenCalledWith(expect.objectContaining({
      batchNumber: 7,
      provider: {
        certFilePath: '/certs/x.pfx',
        certPasswordEnvVar: 'X_PASS',
        environment: NfsProviderEnvironment.Demonstration,
        vendorConfig: { municipioSlug: 'demonstracao' },
      },
      rpsList: [
        expect.objectContaining({
          rpsNumber: 7,
          rpsSeries: 'NFSE',
          issueDate: today,
          competence: today,
          taker: expect.objectContaining({
            address: expect.objectContaining({
              cityCodeIbge: '3550308',
              zipCode: '01310100',
              complement: 'Sala 301',
            }),
          }),
          service: expect.objectContaining({
            nbsCode: '1.1501.30.00',
            issRetentionResponsible: 1,
            ibsCbs: {
              indopCode: '050101',
              cst: '000',
              cClassTrib: '000001',
            },
          }),
        }),
      ],
    }));
    expect(nfseDao.updateStatus).toHaveBeenCalledWith(1, {
      status: NfseStatus.SUBMITTED,
      batchProtocol: 'protocol-123',
    });
    expect(queueProducer.addPollBatchJob).toHaveBeenCalledWith(
      { nfseId: 1, attempt: 1 },
      { delayMs: 30_000 },
    );
  });

  it('should omit taker address when the snapshot has no takerAddress', async() => {
    // Arrange
    const snapshot = makeNfseDto().data as unknown as NfseIssueSnapshot;
    delete snapshot.takerAddress;
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(makeNfseDto({
      data: snapshot as unknown as Record<string, unknown>,
    }));
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
    jest.spyOn(nfsGenerationGateway, 'issueBatch').mockResolvedValue({ batchProtocol: 'protocol-123' });

    // Act
    await sut.execute({ nfseId: 1 });

    // Assert
    expect(nfsGenerationGateway.issueBatch).toHaveBeenCalledWith(expect.objectContaining({
      rpsList: [
        expect.objectContaining({
          taker: expect.objectContaining({
            address: undefined,
          }),
        }),
      ],
    }));
  });

  it('should apply default ibsCbs values when cst and cClassTrib are missing from the snapshot', async() => {
    // Arrange
    const snapshot = makeNfseDto().data as unknown as NfseIssueSnapshot;
    delete snapshot.input.service.ibsCbsCst;
    delete snapshot.input.service.cClassTrib;
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(makeNfseDto({
      data: snapshot as unknown as Record<string, unknown>,
    }));
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
    jest.spyOn(nfsGenerationGateway, 'issueBatch').mockResolvedValue({ batchProtocol: 'protocol-123' });

    // Act
    await sut.execute({ nfseId: 1 });

    // Assert
    expect(nfsGenerationGateway.issueBatch).toHaveBeenCalledWith(expect.objectContaining({
      rpsList: [
        expect.objectContaining({
          service: expect.objectContaining({
            ibsCbs: {
              indopCode: '050101',
              cst: '000',
              cClassTrib: '000001',
            },
          }),
        }),
      ],
    }));
  });

  it('should mark the nfse FAILED and not schedule a poll job when the gateway call fails', async() => {
    // Arrange
    const gatewayError = new Error('Giss indisponível');
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(makeNfseDto());
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
    jest.spyOn(nfsGenerationGateway, 'issueBatch').mockRejectedValue(gatewayError);
    const loggerSpy = jest.spyOn(logger, 'error');

    // Act
    await sut.execute({ nfseId: 1 });

    // Assert
    expect(loggerSpy).toHaveBeenCalledWith(LogContext.NFS_GENERATION, {
      adapter: 'nfse',
      action: 'processIssueNfseBatch',
      error: gatewayError,
    });
    expect(nfseDao.updateStatus).toHaveBeenCalledWith(1, {
      status: NfseStatus.FAILED,
      errorMessage: 'Giss indisponível',
    });
    expect(queueProducer.addPollBatchJob).not.toHaveBeenCalled();
  });

  it('should use a default pt-BR error message when the gateway error has no message', async() => {
    // Arrange
    jest.spyOn(nfseDao, 'findById').mockResolvedValue(makeNfseDto());
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
    jest.spyOn(nfsGenerationGateway, 'issueBatch').mockRejectedValue({});

    // Act
    await sut.execute({ nfseId: 1 });

    // Assert
    expect(nfseDao.updateStatus).toHaveBeenCalledWith(1, {
      status: NfseStatus.FAILED,
      errorMessage: 'Erro desconhecido ao enviar lote ao provedor de NFS-e',
    });
    expect(queueProducer.addPollBatchJob).not.toHaveBeenCalled();
  });
});
