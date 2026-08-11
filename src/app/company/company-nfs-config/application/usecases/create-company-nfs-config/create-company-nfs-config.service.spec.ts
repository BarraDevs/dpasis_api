import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { FindCompanyById } from 'src/app/company/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { CompanyDto } from 'src/app/company/company/application/dtos/company.dto';
import { CompanyNfsConfigDto } from 'src/app/company/company-nfs-config/application/dtos/company-nfs-config.dto';
import { CompanyNfsConfigAlreadyExistsError } from 'src/app/company/company-nfs-config/domain/errors/company-nfs-config-already-exists.error';
import { TOKENS } from 'src/core/di/token';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import type { ICompanyNfsConfigDao } from '../../persistence/dao/company-nfs-config-dao.interface';
import { CreateCompanyNfsConfig } from './create-company-nfs-config.service';
import { CreateCompanyNfsConfigInputDto, CreateCompanyNfsConfigOutputDto } from './dtos/create-company-nfs-config.dto';

function makeValidCreateCompanyNfsConfigInput(overrides: Partial<CreateCompanyNfsConfigInputDto> = {}): CreateCompanyNfsConfigInputDto {
  return {
    companyId: 1,
    vendor: 'giss',
    municipalRegistration: '12345',
    municipalCodeIbge: '3529401',
    serieRps: 'NFSE',
    environment: NfsProviderEnvironment.Demonstration,
    certFilePath: '/certs/x.pfx',
    certPasswordEnvVar: 'X_PASS',
    vendorConfig: { municipioSlug: 'demonstracao' },
    ...overrides,
  };
}

describe('CreateCompanyNfsConfig - Unit tests', () => {
  let sut: CreateCompanyNfsConfig;
  let companyNfsConfigDao: ICompanyNfsConfigDao;
  let findCompanyById: FindCompanyById;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        CreateCompanyNfsConfig,
        { provide: TOKENS.CompanyNfsConfigDao, useValue: createMock<ICompanyNfsConfigDao>() },
        { provide: FindCompanyById, useValue: createMock<FindCompanyById>() },
      ],
    }).compile();

    sut = module.get(CreateCompanyNfsConfig);
    companyNfsConfigDao = module.get(TOKENS.CompanyNfsConfigDao);
    findCompanyById = module.get(FindCompanyById);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw CompanyNfsConfigAlreadyExistsError when config already exists', async() => {
    // Arrange
    const input = makeValidCreateCompanyNfsConfigInput();
    jest.spyOn(findCompanyById, 'execute').mockResolvedValue(createMock<CompanyDto>({ id: 1 }));
    jest.spyOn(companyNfsConfigDao, 'findByCompanyId').mockResolvedValue(createMock<CompanyNfsConfigDto>({ id: 10, companyId: 1 }));

    // Act & Assert
    await expect(sut.execute(input)).rejects.toThrow(CompanyNfsConfigAlreadyExistsError);
    expect(companyNfsConfigDao.save).not.toHaveBeenCalled();
  });

  it('should save and return id', async() => {
    // Arrange
    const input = makeValidCreateCompanyNfsConfigInput();
    jest.spyOn(findCompanyById, 'execute').mockResolvedValue(createMock<CompanyDto>({ id: 1 }));
    jest.spyOn(companyNfsConfigDao, 'findByCompanyId').mockResolvedValue(null);
    jest.spyOn(companyNfsConfigDao, 'save').mockResolvedValue(42);

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(companyNfsConfigDao.save).toHaveBeenCalledWith(input);
    expect(result).toEqual<CreateCompanyNfsConfigOutputDto>({ id: 42 });
  });
});
