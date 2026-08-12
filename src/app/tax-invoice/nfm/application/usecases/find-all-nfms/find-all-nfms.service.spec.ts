import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { FindCompanyById } from 'src/app/company/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { CompanyDto } from 'src/app/company/company/application/dtos/company.dto';
import { CompanyNfsConfigDto } from 'src/app/company/company-nfs-config/application/dtos/company-nfs-config.dto';
import { FindCompanyNfsConfigByCompanyId } from 'src/app/company/company-nfs-config/application/usecases/find-company-nfs-config-by-company-id/find-company-nfs-config-by-company-id.service';
import { TOKENS } from 'src/core/di/token';
import { NfsNoteDto } from 'src/infra/nfs-generation/dtos/find-nfs-servico-prestado.dto';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import type { INfsGenerationGateway } from 'src/infra/nfs-generation/nfs-generation.gateway';
import { InvalidNfmInvoiceQueryError } from '../../../domain/errors/invalid-nfm-invoice-query.error';
import { FindAllNfmsQueryDto } from './dtos/find-all-nfms.dto';
import { FindAllNfms } from './find-all-nfms.service';

describe('FindAllNfms - Unit tests', () => {
  let sut: FindAllNfms;
  let nfsGenerationGateway: INfsGenerationGateway;
  let findCompanyById: FindCompanyById;
  let findCompanyNfsConfigByCompanyId: FindCompanyNfsConfigByCompanyId;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      providers: [
        FindAllNfms,
        { provide: TOKENS.NfsGenerationGateway, useValue: createMock<INfsGenerationGateway>() },
        { provide: FindCompanyById, useValue: createMock<FindCompanyById>() },
        { provide: FindCompanyNfsConfigByCompanyId, useValue: createMock<FindCompanyNfsConfigByCompanyId>() },
      ],
    }).compile();

    sut = module.get(FindAllNfms);
    nfsGenerationGateway = module.get(TOKENS.NfsGenerationGateway);
    findCompanyById = module.get(FindCompanyById);
    findCompanyNfsConfigByCompanyId = module.get(FindCompanyNfsConfigByCompanyId);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('execute', () => {
    const providerConfig = createMock<CompanyNfsConfigDto>({
      certFilePath: '/certs/x.pfx',
      certPasswordEnvVar: 'X_PASS',
      environment: NfsProviderEnvironment.Demonstration,
      municipalRegistration: '12345',
      vendorConfig: { municipioSlug: 'demonstracao' },
    });
    const company = createMock<CompanyDto>({ document: '12345678000199' });

    it('should call findAllNFse with period filters', async() => {
      // Arrange
      const queries: FindAllNfmsQueryDto = {
        companyId: 10,
        page: 2,
        dateFrom: '2026-08-01',
        dateTo: '2026-08-31',
        recipientDocument: '98765432000111',
      };
      const output = [createMock<NfsNoteDto>()];
      jest.spyOn(findCompanyById, 'execute').mockResolvedValue(company);
      jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
      const findSpy = jest.spyOn(nfsGenerationGateway, 'findAllNFse').mockResolvedValue(output);

      // Act
      const result = await sut.execute(queries);

      // Assert
      expect(result).toEqual(output);
      expect(findSpy).toHaveBeenCalledWith({
        provider: {
          certFilePath: '/certs/x.pfx',
          certPasswordEnvVar: 'X_PASS',
          environment: NfsProviderEnvironment.Demonstration,
          vendorConfig: { municipioSlug: 'demonstracao' },
        },
        providerDocument: '12345678000199',
        providerMunicipalRegistration: '12345',
        page: 2,
        periodFrom: '2026-08-01',
        periodTo: '2026-08-31',
        nfseNumber: undefined,
        takerDocument: '98765432000111',
      });
    });

    it('should call findAllNFse with nfseNumber', async() => {
      // Arrange
      const queries: FindAllNfmsQueryDto = {
        companyId: 10,
        nfseNumber: '1000',
      };
      jest.spyOn(findCompanyById, 'execute').mockResolvedValue(company);
      jest.spyOn(findCompanyNfsConfigByCompanyId, 'execute').mockResolvedValue(providerConfig);
      const findSpy = jest.spyOn(nfsGenerationGateway, 'findAllNFse').mockResolvedValue([]);

      // Act
      await sut.execute(queries);

      // Assert
      expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({
        page: 1,
        nfseNumber: '1000',
        periodFrom: undefined,
        periodTo: undefined,
      }));
    });

    it('should throw when neither period nor nfseNumber is provided', async() => {
      // Arrange
      const queries: FindAllNfmsQueryDto = { companyId: 10 };

      // Act & Assert
      await expect(sut.execute(queries)).rejects.toThrow(InvalidNfmInvoiceQueryError);
    });

    it('should throw when both period and nfseNumber are provided', async() => {
      // Arrange
      const queries: FindAllNfmsQueryDto = {
        companyId: 10,
        dateFrom: '2026-08-01',
        dateTo: '2026-08-31',
        nfseNumber: '1000',
      };

      // Act & Assert
      await expect(sut.execute(queries)).rejects.toThrow(InvalidNfmInvoiceQueryError);
    });

    it('should throw when only one of dateFrom/dateTo is provided', async() => {
      // Arrange
      const queries: FindAllNfmsQueryDto = {
        companyId: 10,
        dateFrom: '2026-08-01',
      };

      // Act & Assert
      await expect(sut.execute(queries)).rejects.toThrow(InvalidNfmInvoiceQueryError);
      await expect(sut.execute(queries)).rejects.toThrow('dateFrom e dateTo devem ser enviados juntos');
    });

    it('should throw when only dateTo is provided', async() => {
      // Arrange
      const queries: FindAllNfmsQueryDto = {
        companyId: 10,
        dateTo: '2026-08-31',
      };

      // Act & Assert
      await expect(sut.execute(queries)).rejects.toThrow(InvalidNfmInvoiceQueryError);
      await expect(sut.execute(queries)).rejects.toThrow('dateFrom e dateTo devem ser enviados juntos');
    });

    it('should throw when nfseNumber is empty and period is missing', async() => {
      // Arrange
      const queries: FindAllNfmsQueryDto = {
        companyId: 10,
        nfseNumber: '',
      };

      // Act & Assert
      await expect(sut.execute(queries)).rejects.toThrow(InvalidNfmInvoiceQueryError);
      await expect(sut.execute(queries)).rejects.toThrow(
        'Informe o período de emissão (dateFrom e dateTo) ou nfseNumber, exclusivamente',
      );
    });

    it('should not call gateway when query validation fails', async() => {
      // Arrange
      const queries: FindAllNfmsQueryDto = { companyId: 10 };
      const findSpy = jest.spyOn(nfsGenerationGateway, 'findAllNFse');
      const companySpy = jest.spyOn(findCompanyById, 'execute');

      // Act
      await expect(sut.execute(queries)).rejects.toThrow(InvalidNfmInvoiceQueryError);

      // Assert
      expect(findSpy).not.toHaveBeenCalled();
      expect(companySpy).not.toHaveBeenCalled();
    });
  });
});
