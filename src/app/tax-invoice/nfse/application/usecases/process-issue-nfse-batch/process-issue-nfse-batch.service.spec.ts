import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CompanyNfsConfigDto } from 'src/app/company/company-nfs-config/application/dtos/company-nfs-config.dto';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { CompanyNfsConfigNotFoundError } from 'src/app/company/company-nfs-config/domain/errors/company-nfs-config-not-found.error';
import { SAO_PAULO_TIMEZONE } from 'src/core/constants/timezone.constant';
import { TOKENS } from 'src/core/di/token';
import { LogContext, type ILoggerGateway } from 'src/infra/logger/logger.gateway';
import { NfsBatchErrorKind } from 'src/infra/nfs-generation/dtos/nfs-batch-status.dto';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import { NfsBatchRejectedError } from 'src/infra/nfs-generation/errors/nfs-batch-rejected.error';
import { NfsProviderConfigError } from 'src/infra/nfs-generation/errors/nfs-provider-config.error';
import type { INfsGenerationGateway } from 'src/infra/nfs-generation/nfs-generation.gateway';
import { Nfse, NfseProps } from '../../../domain/entities/nfse.entity';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { NfseFactory } from '../../../domain/factories/nfse.factory';
import type { INfseRepository } from '../../persistence/repository/nfse-repository.interface';
import type { INfseQueueProducer } from '../../queue/nfse-queue-producer.interface';
import { NfseIssueSnapshot } from '../issue-nfse/issue-nfse.service';
import { ProcessIssueNfseBatch } from './process-issue-nfse-batch.service';

const providerConfig = createMock<CompanyNfsConfigDto>({
  certFilePath: '/certs/x.pfx',
  certPasswordEnvVar: 'X_PASS',
  environment: NfsProviderEnvironment.Demonstration,
  vendorConfig: { municipioSlug: 'demonstracao' },
});

function makeNfseProps(overrides: Partial<NfseProps> = {}): NfseProps {
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
    clientType: 'PJ',
    takerAddress: {
      street: 'Av. Paulista',
      number: '500',
      complement: 'Sala 301',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
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
    data: snapshot as unknown as Record<string, unknown>,
    ...overrides,
  };
}

describe('ProcessIssueNfseBatch - Unit tests', () => {
  let sut: ProcessIssueNfseBatch;
  let logger: ILoggerGateway;
  let nfseRepository: INfseRepository;
  let findCompanyNfsConfigByCompanyId: FindCompanyNfsConfigByCompanyId;
  let nfsGenerationGateway: INfsGenerationGateway;
  let queueProducer: INfseQueueProducer;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        ProcessIssueNfseBatch,
        { provide: TOKENS.LoggerGateway, useValue: createMock<ILoggerGateway>() },
        { provide: TOKENS.NfseRepository, useValue: createMock<INfseRepository>() },
        { provide: FindCompanyNfsConfigByCompanyId, useValue: createMock<FindCompanyNfsConfigByCompanyId>() },
        { provide: TOKENS.NfsGenerationGateway, useValue: createMock<INfsGenerationGateway>() },
        { provide: TOKENS.NfseQueueProducer, useValue: createMock<INfseQueueProducer>() },
      ],
    }).compile();

    sut = module.get(ProcessIssueNfseBatch);
    logger = module.get(TOKENS.LoggerGateway);
    nfseRepository = module.get(TOKENS.NfseRepository);
    findCompanyNfsConfigByCompanyId = module.get(FindCompanyNfsConfigByCompanyId);
    nfsGenerationGateway = module.get(TOKENS.NfsGenerationGateway);
    queueProducer = module.get(TOKENS.NfseQueueProducer);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw NfseNotFoundError when the nfse does not exist', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute({ nfseId: 1 })).rejects.toThrow(NfseNotFoundError);
  });

  it('should be a no-op when the nfse is already ISSUED', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(
      NfseFactory.load(makeNfseProps({ status: NfseStatus.ISSUED })),
    );

    // Act
    await sut.execute({ nfseId: 1 });

    // Assert
    expect(nfsGenerationGateway.issueBatch).not.toHaveBeenCalled();
    expect(nfseRepository.edit).not.toHaveBeenCalled();
    expect(queueProducer.addPollBatchJob).not.toHaveBeenCalled();
  });

  // Um job reentregue pelo BullMQ encontra a nota nestes estados. Reenviar o RPS sem consultar o
  // provedor antes é o caminho para uma segunda NFS-e.
  it.each([
    NfseStatus.SUBMITTED,
    NfseStatus.PROCESSING,
    NfseStatus.AWAITING_PROVIDER,
    NfseStatus.FAILED,
    NfseStatus.CANCELED,
  ])('should refuse to resend the rps when the nfse is %s', async(status) => {
    // Arrange
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(
      NfseFactory.load(makeNfseProps({ status, batchProtocol: 'protocol-123' })),
    );

    // Act
    await sut.execute({ nfseId: 1 });

    // Assert
    expect(nfsGenerationGateway.issueBatch).not.toHaveBeenCalled();
    expect(nfseRepository.edit).not.toHaveBeenCalled();
    expect(queueProducer.addPollBatchJob).not.toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith(LogContext.NFS_GENERATION, expect.objectContaining({
      action: 'processIssueNfseBatch',
      nfseId: 1,
      errorMessage: expect.stringContaining(status),
    }));
  });

  it('should throw CompanyNfsConfigNotFoundError when the company has no provider config', async() => {
    // Arrange
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(NfseFactory.load(makeNfseProps()));
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockRejectedValue(new CompanyNfsConfigNotFoundError());

    // Act & Assert
    await expect(sut.execute({ nfseId: 1 })).rejects.toThrow(CompanyNfsConfigNotFoundError);
  });

  it('should mark the nfse SUBMITTED and schedule a poll job on success', async() => {
    // Arrange
    const today = new Date().toLocaleDateString('en-CA', { timeZone: SAO_PAULO_TIMEZONE });
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
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
    expect(nfseRepository.edit).toHaveBeenCalledWith(nfse);
    expect(nfse.props).toMatchObject({
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
    const snapshot = makeNfseProps().data as unknown as NfseIssueSnapshot;
    delete snapshot.takerAddress;
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(NfseFactory.load(makeNfseProps({
      data: snapshot as unknown as Record<string, unknown>,
    })));
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
    const snapshot = makeNfseProps().data as unknown as NfseIssueSnapshot;
    delete snapshot.input.service.ibsCbsCst;
    delete snapshot.input.service.cClassTrib;
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(NfseFactory.load(makeNfseProps({
      data: snapshot as unknown as Record<string, unknown>,
    })));
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

  it('should park the nfse in AWAITING_PROVIDER when the gateway call fails ambiguously', async() => {
    // Arrange
    const gatewayError = new Error('Giss indisponível');
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
    jest.spyOn(nfsGenerationGateway, 'issueBatch').mockRejectedValue(gatewayError);
    const loggerSpy = jest.spyOn(logger, 'error');

    // Act
    await sut.execute({ nfseId: 1 });

    // Assert
    expect(loggerSpy).toHaveBeenCalledWith(LogContext.NFS_GENERATION, {
      adapter: 'nfse',
      action: 'processIssueNfseBatch',
      nfseId: 1,
      error: gatewayError,
    });
    expect(nfseRepository.edit).toHaveBeenCalledWith(nfse);
    expect(nfse.props).toMatchObject({
      status: NfseStatus.AWAITING_PROVIDER,
      errorMessage: 'Giss indisponível',
    });
    expect(queueProducer.addPollBatchJob).not.toHaveBeenCalled();
  });

  it('should use a default pt-BR error message when the gateway error has no message', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
    jest.spyOn(nfsGenerationGateway, 'issueBatch').mockRejectedValue({});

    // Act
    await sut.execute({ nfseId: 1 });

    // Assert
    expect(nfseRepository.edit).toHaveBeenCalledWith(expect.any(Nfse));
    expect(nfse.props).toMatchObject({
      status: NfseStatus.AWAITING_PROVIDER,
      errorMessage: 'Erro desconhecido ao enviar lote ao provedor de NFS-e',
    });
    expect(queueProducer.addPollBatchJob).not.toHaveBeenCalled();
  });

  it('should mark the nfse FAILED when the provider configuration is invalid', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
    jest.spyOn(nfsGenerationGateway, 'issueBatch')
      .mockRejectedValue(new NfsProviderConfigError('Certificado digital não encontrado'));

    // Act
    await sut.execute({ nfseId: 1 });

    // Assert
    expect(nfse.props).toMatchObject({
      status: NfseStatus.FAILED,
      errorMessage: 'Certificado digital não encontrado',
    });
    expect(queueProducer.addPollBatchJob).not.toHaveBeenCalled();
  });

  it('should mark the nfse REJECTED when the batch is rejected for a business reason', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
    jest.spyOn(nfsGenerationGateway, 'issueBatch').mockRejectedValue(new NfsBatchRejectedError([
      { code: 'E202', message: 'Código de tributação não informado', kind: NfsBatchErrorKind.BusinessRejection },
    ]));

    // Act
    await sut.execute({ nfseId: 1 });

    // Assert
    expect(nfse.props).toMatchObject({
      status: NfseStatus.REJECTED,
      errorMessage: 'E202: Código de tributação não informado',
    });
  });

  it('should park the nfse in AWAITING_PROVIDER when the batch is rejected as already submitted', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
    jest.spyOn(nfsGenerationGateway, 'issueBatch').mockRejectedValue(new NfsBatchRejectedError([
      // code is opaque — use case must branch on kind, not vendor code
      { code: 'X', message: 'RPS já informado.', kind: NfsBatchErrorKind.AlreadySubmitted },
    ]));

    // Act
    await sut.execute({ nfseId: 1 });

    // Assert
    expect(nfse.props).toMatchObject({
      status: NfseStatus.AWAITING_PROVIDER,
      errorMessage: 'X: RPS já informado.',
    });
    expect(queueProducer.addPollBatchJob).not.toHaveBeenCalled();
  });

  it('should park the nfse in AWAITING_PROVIDER when already-submitted is not the first rejection', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
    jest.spyOn(nfsGenerationGateway, 'issueBatch').mockRejectedValue(new NfsBatchRejectedError([
      { code: 'A9', message: 'Inscrição municipal incorreta.', kind: NfsBatchErrorKind.BusinessRejection },
      { code: 'X', message: 'RPS já informado.', kind: NfsBatchErrorKind.AlreadySubmitted },
    ]));

    // Act
    await sut.execute({ nfseId: 1 });

    // Assert
    expect(nfse.props.status).toBe(NfseStatus.AWAITING_PROVIDER);
  });
});
