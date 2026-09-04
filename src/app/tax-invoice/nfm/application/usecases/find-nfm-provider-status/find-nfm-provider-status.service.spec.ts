import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CompanyNfsConfigDto } from 'src/app/company/company-nfs-config/application/dtos/company-nfs-config.dto';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { Nfse, NfseProps } from 'src/app/tax-invoice/nfse/domain/entities/nfse.entity';
import { NfseStatus } from 'src/app/tax-invoice/nfse/domain/enums/nfse-status.enum';
import { NfseFactory } from 'src/app/tax-invoice/nfse/domain/factories/nfse.factory';
import { TOKENS } from 'src/core/di/token';
import { NfsBatchErrorKind } from 'src/infra/nfs-generation/dtos/nfs-batch-status.dto';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import type { INfsGenerationGateway } from 'src/infra/nfs-generation/nfs-generation.gateway';
import { Nfm } from '../../../domain/entities/nfm.entity';
import { NfmNfseMissingError } from '../../../domain/errors/nfm-nfse-missing.error';
import { NfmNotFoundError } from '../../../domain/errors/nfm-not-found.error';
import { NfmFactory } from '../../../domain/factories/nfm.factory';
import type { INfmRepository } from '../../persistence/repository/nfm-repository.interface';
import { FindNfmProviderStatus } from './find-nfm-provider-status.service';

const providerConfig = createMock<CompanyNfsConfigDto>({
  certFilePath: '/certs/x.pfx',
  certPasswordEnvVar: 'X_PASS',
  environment: NfsProviderEnvironment.Demonstration,
  municipalRegistration: '16895',
  vendorConfig: { municipioSlug: 'demonstracao' },
});

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
    data: { providerDocument: '12345678000199' },
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

describe('FindNfmProviderStatus - Unit tests', () => {
  let sut: FindNfmProviderStatus;
  let nfmRepository: INfmRepository;
  let nfsGenerationGateway: INfsGenerationGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindNfmProviderStatus,
        { provide: TOKENS.NfmRepository, useValue: createMock<INfmRepository>() },
        { provide: TOKENS.NfsGenerationGateway, useValue: createMock<INfsGenerationGateway>() },
        { provide: FindCompanyNfsConfigByCompanyId, useValue: createMock<FindCompanyNfsConfigByCompanyId>() },
      ],
    }).compile();

    sut = module.get(FindNfmProviderStatus);
    nfmRepository = module.get(TOKENS.NfmRepository);
    nfsGenerationGateway = module.get(TOKENS.NfsGenerationGateway);
    jest.spyOn(module.get(FindCompanyNfsConfigByCompanyId), 'execute').mockResolvedValue(providerConfig);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw when the nfm does not exist', async() => {
    // Arrange
    jest.spyOn(nfmRepository, 'findById').mockResolvedValue(null);

    // Act & Assert
    await expect(sut.execute(10)).rejects.toThrow(NfmNotFoundError);
  });

  it('should throw when the nfm has no linked nfse', async() => {
    // Arrange
    jest.spyOn(nfmRepository, 'findById').mockResolvedValue(makeNfm(null));

    // Act & Assert
    await expect(sut.execute(10)).rejects.toThrow(NfmNfseMissingError);
  });

  it('should query by the natural RPS key with document and municipal registration', async() => {
    // Arrange
    jest.spyOn(nfmRepository, 'findById').mockResolvedValue(makeNfm(NfseFactory.load(makeNfseProps())));
    jest.spyOn(nfsGenerationGateway, 'findNfseByRps').mockResolvedValue({ found: false });

    // Act
    await sut.execute(10);

    // Assert
    expect(nfsGenerationGateway.findNfseByRps).toHaveBeenCalledWith(expect.objectContaining({
      nfseId: 99,
      rpsNumber: 41,
      rpsSeries: 'NFSE',
      providerDocument: '12345678000199',
      providerMunicipalRegistration: '16895',
    }));
  });

  it('should report what the provider answered without writing anything', async() => {
    // Arrange
    const note = { rpsNumber: 41, rpsSeries: 'NFSE', nfseNumber: '12345', verificationCode: 'ABC', issueDate: 'D' };
    jest.spyOn(nfmRepository, 'findById').mockResolvedValue(makeNfm(NfseFactory.load(makeNfseProps())));
    jest.spyOn(nfsGenerationGateway, 'findNfseByRps').mockResolvedValue({ found: true, note });

    // Act
    const result = await sut.execute(10);

    // Assert
    expect(result).toMatchObject({ nfseId: 99, rpsNumber: 41, rpsSeries: 'NFSE', found: true, note });
    expect(result.consultedAt).toBeInstanceOf(Date);
    expect(nfmRepository.edit).not.toHaveBeenCalled();
  });

  it('should surface the provider messages when the note was not found', async() => {
    // Arrange
    const errors = [{ code: 'E212', message: 'NFS-e não encontrada', kind: NfsBatchErrorKind.NotFound }];
    jest.spyOn(nfmRepository, 'findById').mockResolvedValue(makeNfm(NfseFactory.load(makeNfseProps())));
    jest.spyOn(nfsGenerationGateway, 'findNfseByRps').mockResolvedValue({ found: false, errors });

    // Act
    const result = await sut.execute(10);

    // Assert
    expect(result.found).toBe(false);
    expect(result.errors).toBe(errors);
  });
});
