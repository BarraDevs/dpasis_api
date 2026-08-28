import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CompanyNfsConfigDto } from 'src/app/company/company-nfs-config/application/dtos/company-nfs-config.dto';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { CompanyNfsConfigNotFoundError } from 'src/app/company/company-nfs-config/domain/errors/company-nfs-config-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import type { INfsGenerationGateway } from 'src/infra/nfs-generation/nfs-generation.gateway';
import { NfseProps } from '../../../domain/entities/nfse.entity';
import { NfseStatus } from '../../../domain/enums/nfse-status.enum';
import { NfseAlreadyCanceledError } from '../../../domain/errors/nfse-already-canceled.error';
import { NfseNotFoundError } from '../../../domain/errors/nfse-not-found.error';
import { NfseNotIssuedError } from '../../../domain/errors/nfse-not-issued.error';
import { NfseFactory } from '../../../domain/factories/nfse.factory';
import type { INfseRepository } from '../../persistence/repository/nfse-repository.interface';
import { CancelNfse } from './cancel-nfse.service';
import { CancelNfseInputDto } from './dtos/cancel-nfse.dto';

function makeNfseProps(overrides: Partial<NfseProps> = {}): NfseProps {
  return {
    id: 1,
    companyId: 1,
    clientId: 1,
    rpsNumber: 7,
    rpsSeries: 'NFSE',
    status: NfseStatus.ISSUED,
    batchProtocol: 'protocol-123',
    nfseNumber: '1000',
    verificationCode: 'ABC123',
    issuedAt: new Date('2026-07-20T10:00:00Z'),
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
  municipalCodeIbge: '3529401',
  municipalRegistration: '12345',
});

describe('CancelNfse - Unit tests', () => {
  let sut: CancelNfse;
  let nfseRepository: INfseRepository;
  let findCompanyNfsConfigByCompanyId: FindCompanyNfsConfigByCompanyId;
  let nfsGenerationGateway: INfsGenerationGateway;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        CancelNfse,
        { provide: TOKENS.NfseRepository, useValue: createMock<INfseRepository>() },
        { provide: FindCompanyNfsConfigByCompanyId, useValue: createMock<FindCompanyNfsConfigByCompanyId>() },
        { provide: TOKENS.NfsGenerationGateway, useValue: createMock<INfsGenerationGateway>() },
      ],
    }).compile();

    sut = module.get(CancelNfse);
    nfseRepository = module.get(TOKENS.NfseRepository);
    findCompanyNfsConfigByCompanyId = module.get(FindCompanyNfsConfigByCompanyId);
    nfsGenerationGateway = module.get(TOKENS.NfsGenerationGateway);
  });

  const input: CancelNfseInputDto = { cancelReasonCode: 2 };

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw NfseNotFoundError when the nfse does not exist', async() => {
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(null);

    await expect(sut.execute(1, input)).rejects.toThrow(NfseNotFoundError);
    expect(nfsGenerationGateway.cancelNfse).not.toHaveBeenCalled();
  });

  it('should throw NfseAlreadyCanceledError and not call the gateway when status is CANCELED', async() => {
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(
      NfseFactory.load(makeNfseProps({ status: NfseStatus.CANCELED })),
    );

    await expect(sut.execute(1, input)).rejects.toThrow(NfseAlreadyCanceledError);
    expect(nfsGenerationGateway.cancelNfse).not.toHaveBeenCalled();
    expect(nfseRepository.edit).not.toHaveBeenCalled();
  });

  it.each([NfseStatus.PENDING, NfseStatus.SUBMITTED, NfseStatus.PROCESSING, NfseStatus.FAILED])(
    'should throw NfseNotIssuedError and not call the gateway when status is %s',
    async(status) => {
      jest.spyOn(nfseRepository, 'findById').mockResolvedValue(
        NfseFactory.load(makeNfseProps({ status })),
      );

      await expect(sut.execute(1, input)).rejects.toThrow(NfseNotIssuedError);
      expect(nfsGenerationGateway.cancelNfse).not.toHaveBeenCalled();
      expect(nfseRepository.edit).not.toHaveBeenCalled();
    },
  );

  it('should throw CompanyNfsConfigNotFoundError when the company has no provider config', async() => {
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(NfseFactory.load(makeNfseProps()));
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockRejectedValue(new CompanyNfsConfigNotFoundError());

    await expect(sut.execute(1, input)).rejects.toThrow(CompanyNfsConfigNotFoundError);
    expect(nfsGenerationGateway.cancelNfse).not.toHaveBeenCalled();
  });

  it('should cancel an ISSUED nfse: call the gateway, update status and return the output', async() => {
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
    jest.spyOn(nfsGenerationGateway, 'cancelNfse').mockResolvedValue({ confirmedAt: '2026-07-29T12:00:00.000Z' });

    const result = await sut.execute(1, input);

    expect(nfsGenerationGateway.cancelNfse).toHaveBeenCalledWith({
      nfseNumber: '1000',
      providerDocument: '12345678000199',
      providerMunicipalCodeIbge: '3529401',
      providerMunicipalRegistration: '12345',
      cancelReasonCode: 2,
      provider: {
        certFilePath: '/certs/x.pfx',
        certPasswordEnvVar: 'X_PASS',
        environment: NfsProviderEnvironment.Demonstration,
        vendorConfig: { municipioSlug: 'demonstracao' },
      },
    });
    expect(nfseRepository.edit).toHaveBeenCalledWith(nfse);
    expect(nfse.props).toMatchObject({
      status: NfseStatus.CANCELED,
      canceledAt: new Date('2026-07-29T12:00:00.000Z'),
      cancelReasonCode: 2,
    });
    expect(result).toEqual({
      id: 1,
      status: NfseStatus.CANCELED,
      canceledAt: new Date('2026-07-29T12:00:00.000Z'),
    });
  });

  it.each([1, 4])('should forward cancelReasonCode %s to the gateway and persist it', async(cancelReasonCode) => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps());
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
    jest.spyOn(nfsGenerationGateway, 'cancelNfse').mockResolvedValue({ confirmedAt: '2026-07-29T12:00:00.000Z' });

    // Act
    const result = await sut.execute(1, { cancelReasonCode });

    // Assert
    expect(nfsGenerationGateway.cancelNfse).toHaveBeenCalledWith(expect.objectContaining({ cancelReasonCode }));
    expect(nfseRepository.edit).toHaveBeenCalledWith(nfse);
    expect(nfse.props.cancelReasonCode).toBe(cancelReasonCode);
    expect(result.status).toBe(NfseStatus.CANCELED);
  });

  it('should query nfse by the id passed to execute', async() => {
    // Arrange
    const nfse = NfseFactory.load(makeNfseProps({ id: 42 }));
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(nfse);
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
    jest.spyOn(nfsGenerationGateway, 'cancelNfse').mockResolvedValue({ confirmedAt: '2026-07-29T12:00:00.000Z' });

    // Act
    const result = await sut.execute(42, input);

    // Assert
    expect(nfseRepository.findById).toHaveBeenCalledWith(42);
    expect(nfseRepository.edit).toHaveBeenCalledWith(nfse);
    expect(nfse.props.status).toBe(NfseStatus.CANCELED);
    expect(result.id).toBe(42);
  });

  it('should propagate gateway errors without updating status', async() => {
    jest.spyOn(nfseRepository, 'findById').mockResolvedValue(NfseFactory.load(makeNfseProps()));
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
    jest.spyOn(nfsGenerationGateway, 'cancelNfse').mockRejectedValue(new Error('Erro ao cancelar NFS-e no Giss'));

    await expect(sut.execute(1, input)).rejects.toThrow('Erro ao cancelar NFS-e no Giss');
    expect(nfseRepository.edit).not.toHaveBeenCalled();
  });
});
