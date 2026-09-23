import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CompanyNfsConfigDto } from 'src/app/company/company-nfs-config/application/dtos/company-nfs-config.dto';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { CompanyNfsConfigNotFoundError } from 'src/app/company/company-nfs-config/domain/errors/company-nfs-config-not-found.error';
import { CompanyDto } from 'src/app/company/company/application/dtos/company.dto';
import { FindCompanyById } from 'src/app/company/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { CompanyNotFoundError } from 'src/app/company/company/domain/errors/company-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { LIST_ISSUED_NFS_PAGE_SIZE, NfsIssuedNoteListingDto } from 'src/infra/nfs-generation/dtos/list-issued-nfs.dto';
import { NfsBatchErrorKind } from 'src/infra/nfs-generation/dtos/nfs-batch-status.dto';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import type { INfsGenerationGateway } from 'src/infra/nfs-generation/nfs-generation.gateway';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { TransientProviderError } from 'src/shared/errors/transient-provider.error';
import { NfseClassificationKind } from '../../../domain/enums/nfse-classification-kind.enum';
import { InvalidNfsePeriodError } from '../../../domain/errors/invalid-nfse-period.error';
import type { INfseClassificationDao } from '../../persistence/dao/nfse-classification-dao.interface';
import { ListIssuedNfseFromProviderQueryDto } from './dtos/list-issued-nfse-from-provider.dto';
import { ListIssuedNfseFromProvider } from './list-issued-nfse-from-provider.service';

function makeValidQuery(overrides: Partial<ListIssuedNfseFromProviderQueryDto> = {}): ListIssuedNfseFromProviderQueryDto {
  return {
    companyId: 10,
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    ...overrides,
  };
}

function makeNote(overrides: Partial<NfsIssuedNoteListingDto> = {}): NfsIssuedNoteListingDto {
  return {
    rpsNumber: 41,
    rpsSeries: 'NFSE',
    nfseNumber: '9041',
    verificationCode: 'ABC123',
    issueDate: '2026-09-03T10:00:00',
    competence: '2026-09-01',
    takerDocument: '12345678000199',
    takerName: 'Cliente Exemplo LTDA',
    servicesValue: 1500.5,
    netValue: 1425.48,
    description: 'Manutenção predial mensal',
    canceled: false,
    cancellationDate: null,
    cancellationReasonCode: null,
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

const company = createMock<CompanyDto>({ id: 10, document: '12345678000199' });

describe('ListIssuedNfseFromProvider - Unit tests', () => {
  let sut: ListIssuedNfseFromProvider;
  let nfsGenerationGateway: INfsGenerationGateway;
  let nfseClassificationDao: INfseClassificationDao;
  let findCompanyById: FindCompanyById;
  let findCompanyNfsConfigByCompanyId: FindCompanyNfsConfigByCompanyId;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        ListIssuedNfseFromProvider,
        { provide: TOKENS.NfsGenerationGateway, useValue: createMock<INfsGenerationGateway>() },
        { provide: TOKENS.NfseClassificationDao, useValue: createMock<INfseClassificationDao>() },
        { provide: FindCompanyById, useValue: createMock<FindCompanyById>() },
        { provide: FindCompanyNfsConfigByCompanyId, useValue: createMock<FindCompanyNfsConfigByCompanyId>() },
      ],
    }).compile();

    sut = module.get(ListIssuedNfseFromProvider);
    nfsGenerationGateway = module.get(TOKENS.NfsGenerationGateway);
    nfseClassificationDao = module.get(TOKENS.NfseClassificationDao);
    findCompanyById = module.get(FindCompanyById);
    findCompanyNfsConfigByCompanyId = module.get(FindCompanyNfsConfigByCompanyId);

    jest.spyOn(findCompanyById, 'execute').mockResolvedValue(company);
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
    jest.spyOn(nfseClassificationDao, 'findByRpsKeys').mockResolvedValue([]);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should list one Giss page for the company period', async() => {
    // Arrange
    const notes = [makeNote()];
    const listSpy = jest.spyOn(nfsGenerationGateway, 'listIssuedNfseByPeriod').mockResolvedValue({
      notes,
      endOfPages: true,
    });

    // Act
    const result = await sut.execute(makeValidQuery({ page: 2 }));

    // Assert
    expect(listSpy).toHaveBeenCalledWith({
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      page: 2,
      providerDocument: '12345678000199',
      providerMunicipalRegistration: '16895',
      provider: {
        certFilePath: '/certs/x.pfx',
        certPasswordEnvVar: 'X_PASS',
        environment: NfsProviderEnvironment.Demonstration,
        vendorConfig: { municipioSlug: 'demonstracao' },
      },
    });
    expect(result).toEqual({
      companyId: 10,
      page: 2,
      pageSize: LIST_ISSUED_NFS_PAGE_SIZE,
      endOfPages: true,
      notes: [{ ...notes[0], kind: null }],
    });
  });

  it('should default page to 1 when omitted', async() => {
    // Arrange
    const listSpy = jest.spyOn(nfsGenerationGateway, 'listIssuedNfseByPeriod').mockResolvedValue({
      notes: [],
      endOfPages: true,
    });

    // Act
    const result = await sut.execute(makeValidQuery());

    // Assert
    expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    expect(result.page).toBe(1);
    expect(nfseClassificationDao.findByRpsKeys).not.toHaveBeenCalled();
  });

  it('should throw InvalidNfsePeriodError when startDate is after endDate', async() => {
    // Act & Assert
    await expect(sut.execute(makeValidQuery({ startDate: '2026-09-30', endDate: '2026-09-01' })))
      .rejects.toThrow(InvalidNfsePeriodError);
    expect(nfsGenerationGateway.listIssuedNfseByPeriod).not.toHaveBeenCalled();
  });

  it('should propagate CompanyNotFoundError', async() => {
    // Arrange
    jest.spyOn(findCompanyById, 'execute').mockRejectedValue(new CompanyNotFoundError());

    // Act & Assert
    await expect(sut.execute(makeValidQuery())).rejects.toThrow(CompanyNotFoundError);
  });

  it('should propagate CompanyNfsConfigNotFoundError', async() => {
    // Arrange
    jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockRejectedValue(new CompanyNfsConfigNotFoundError());

    // Act & Assert
    await expect(sut.execute(makeValidQuery())).rejects.toThrow(CompanyNfsConfigNotFoundError);
  });

  it('should throw ExternalApiError when the provider returns business errors', async() => {
    // Arrange
    jest.spyOn(nfsGenerationGateway, 'listIssuedNfseByPeriod').mockResolvedValue({
      notes: [],
      endOfPages: false,
      errors: [{
        code: 'E135',
        message: 'Período consultado superior ao permitido',
        kind: NfsBatchErrorKind.BusinessRejection,
      }],
    });

    // Act & Assert
    await expect(sut.execute(makeValidQuery())).rejects.toThrow(ExternalApiError);
    await expect(sut.execute(makeValidQuery())).rejects.toThrow(
      'Erro ao consultar NFS-e por período no Giss: E135: Período consultado superior ao permitido',
    );
  });

  it('should let TransientProviderError through', async() => {
    // Arrange
    const error = new TransientProviderError('timeout', 30);
    jest.spyOn(nfsGenerationGateway, 'listIssuedNfseByPeriod').mockRejectedValue(error);

    // Act & Assert
    await expect(sut.execute(makeValidQuery())).rejects.toBe(error);
  });

  it('should attach kind from the local classification matching series case-insensitively', async() => {
    // Arrange
    const classified = makeNote({ rpsNumber: 41, rpsSeries: 'nfse' });
    const unclassified = makeNote({ rpsNumber: 42, rpsSeries: 'A' });
    jest.spyOn(nfsGenerationGateway, 'listIssuedNfseByPeriod').mockResolvedValue({
      notes: [classified, unclassified],
      endOfPages: true,
    });
    jest.spyOn(nfseClassificationDao, 'findByRpsKeys').mockResolvedValue([
      {
        id: 1,
        companyId: 10,
        rpsNumber: 41,
        rpsSeries: 'NFSE',
        kind: NfseClassificationKind.NFM,
        createdAt: new Date('2026-09-01T00:00:00.000Z'),
        updatedAt: new Date('2026-09-01T00:00:00.000Z'),
      },
    ]);

    // Act
    const result = await sut.execute(makeValidQuery());

    // Assert
    expect(nfseClassificationDao.findByRpsKeys).toHaveBeenCalledWith(10, [
      { rpsNumber: 41, rpsSeries: 'NFSE' },
      { rpsNumber: 42, rpsSeries: 'A' },
    ]);
    expect(result.notes).toEqual([
      { ...classified, kind: NfseClassificationKind.NFM },
      { ...unclassified, kind: null },
    ]);
  });
});
