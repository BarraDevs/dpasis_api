import { Test } from '@nestjs/testing';
import { CompanyNfsConfigNotFoundError } from 'src/app/company/company-nfs-config/domain/errors/company-nfs-config-not-found.error';
import { CompanyNotFoundError } from 'src/app/company/company/domain/errors/company-not-found.error';
import { TOKENS } from 'src/core/di/token';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { NfsGenerationFakeAdapterGateway } from 'src/infra/nfs-generation/adapters/fake/nfs-generation-fake.gateway';
import { LIST_ISSUED_NFS_PAGE_SIZE, NfsIssuedNoteListingDto } from 'src/infra/nfs-generation/dtos/list-issued-nfs.dto';
import { NfsBatchErrorKind } from 'src/infra/nfs-generation/dtos/nfs-batch-status.dto';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import { ExternalApiError } from 'src/shared/errors/external-api.error';
import { buildMinimalCompanyData } from 'src/test/fixtures/minimal-company';
import { InvalidNfsePeriodError } from '../../../domain/errors/invalid-nfse-period.error';
import { NfseModule } from '../../../nfse.module';
import { ListIssuedNfseFromProvider } from './list-issued-nfse-from-provider.service';

async function seedCompany(prisma: PrismaService) {
  return prisma.company.create({ data: buildMinimalCompanyData() });
}

async function seedProviderConfig(prisma: PrismaService, companyId: number) {
  return prisma.nfsProviderConfig.create({
    data: {
      companyId,
      vendor: 'giss',
      municipalRegistration: '16895',
      municipalCodeIbge: '3529401',
      serieRps: 'NFSE',
      environment: NfsProviderEnvironment.Demonstration,
      certFilePath: '/certs/x.pfx',
      certPasswordEnvVar: 'X_PASS',
      vendorConfig: { municipioSlug: 'demonstracao' },
    },
  });
}

function makeNote(): NfsIssuedNoteListingDto {
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
  };
}

describe('ListIssuedNfseFromProvider - Integration tests', () => {
  let sut: ListIssuedNfseFromProvider;
  let prisma: PrismaService;
  let nfsGenerationGateway: NfsGenerationFakeAdapterGateway;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [NfseModule],
    }).compile();

    sut = module.get(ListIssuedNfseFromProvider);
    prisma = module.get(PrismaService);
    nfsGenerationGateway = module.get(TOKENS.NfsGenerationGateway);
  });

  beforeEach(async() => {
    await prisma.truncate();
    nfsGenerationGateway.listIssuedNfseByPeriodCalls.length = 0;
    nfsGenerationGateway.listIssuedNfseByPeriodError = null;
    nfsGenerationGateway.listIssuedNfseByPeriodResult = { notes: [], endOfPages: true };
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should call the provider with company document and config, without reading nfse rows', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    await seedProviderConfig(prisma, company.id);
    const note = makeNote();
    nfsGenerationGateway.listIssuedNfseByPeriodResult = { notes: [note], endOfPages: false };

    // Act
    const result = await sut.execute({
      companyId: company.id,
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      page: 2,
    });

    // Assert
    expect(nfsGenerationGateway.listIssuedNfseByPeriodCalls).toEqual([{
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      page: 2,
      providerDocument: company.document,
      providerMunicipalRegistration: '16895',
      provider: {
        certFilePath: '/certs/x.pfx',
        certPasswordEnvVar: 'X_PASS',
        environment: NfsProviderEnvironment.Demonstration,
        vendorConfig: { municipioSlug: 'demonstracao' },
      },
    }]);
    expect(result).toEqual({
      companyId: company.id,
      page: 2,
      pageSize: LIST_ISSUED_NFS_PAGE_SIZE,
      endOfPages: false,
      notes: [note],
    });
    expect(await prisma.nfse.count()).toBe(0);
    expect(await prisma.nfm.count()).toBe(0);
  });

  it('should throw CompanyNotFoundError when the company does not exist', async() => {
    // Act & Assert
    await expect(sut.execute({
      companyId: 9_999_999,
      startDate: '2026-09-01',
      endDate: '2026-09-30',
    })).rejects.toThrow(CompanyNotFoundError);
    expect(nfsGenerationGateway.listIssuedNfseByPeriodCalls).toHaveLength(0);
  });

  it('should throw CompanyNfsConfigNotFoundError when the company has no NFS config', async() => {
    // Arrange
    const company = await seedCompany(prisma);

    // Act & Assert
    await expect(sut.execute({
      companyId: company.id,
      startDate: '2026-09-01',
      endDate: '2026-09-30',
    })).rejects.toThrow(CompanyNfsConfigNotFoundError);
    expect(nfsGenerationGateway.listIssuedNfseByPeriodCalls).toHaveLength(0);
  });

  it('should throw InvalidNfsePeriodError when startDate is after endDate', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    await seedProviderConfig(prisma, company.id);

    // Act & Assert
    await expect(sut.execute({
      companyId: company.id,
      startDate: '2026-09-30',
      endDate: '2026-09-01',
    })).rejects.toThrow(InvalidNfsePeriodError);
    expect(nfsGenerationGateway.listIssuedNfseByPeriodCalls).toHaveLength(0);
  });

  it('should throw ExternalApiError when the provider returns a business error', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    await seedProviderConfig(prisma, company.id);
    nfsGenerationGateway.listIssuedNfseByPeriodResult = {
      notes: [],
      endOfPages: false,
      errors: [{
        code: 'E135',
        message: 'Período consultado superior ao permitido',
        kind: NfsBatchErrorKind.BusinessRejection,
      }],
    };

    // Act & Assert
    await expect(sut.execute({
      companyId: company.id,
      startDate: '2026-09-01',
      endDate: '2026-09-30',
    })).rejects.toThrow(ExternalApiError);
  });
});
