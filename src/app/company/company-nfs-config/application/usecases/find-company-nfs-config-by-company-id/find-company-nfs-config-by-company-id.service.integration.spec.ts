import { Test } from '@nestjs/testing';
import { CompanyNfsConfigModule } from 'src/app/company/company-nfs-config/company-nfs-config.module';
import { CompanyNfsConfigNotFoundError } from 'src/app/company/company-nfs-config/domain/errors/company-nfs-config-not-found.error';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { FindCompanyNfsConfigByCompanyId } from './find-company-nfs-config-by-company-id.service';

describe('FindCompanyNfsConfigByCompanyId - Integration tests', () => {
  let sut: FindCompanyNfsConfigByCompanyId;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CompanyNfsConfigModule],
    }).compile();

    sut = module.get(FindCompanyNfsConfigByCompanyId);
    prisma = module.get(PrismaService);
  });

  beforeEach(async() => {
    await prisma.truncate();
  });

  afterAll(async() => {
    await prisma.truncate();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw CompanyNfsConfigNotFoundError when company has no config', async() => {
    // Arrange
    const company = await prisma.company.create({
      data: {
        name: 'Empresa Teste',
        fantasyName: 'Empresa Teste',
        document: `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 14),
        active: true,
        zipCode: '01310100',
        street: 'Av Paulista',
        number: '100',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        phone01: '11999999999',
        email01: `empresa-${Date.now()}@test.com`,
      },
    });

    // Act & Assert
    await expect(sut.execute(company.id)).rejects.toThrow(CompanyNfsConfigNotFoundError);
  });

  it('should return config when it exists', async() => {
    // Arrange
    const company = await prisma.company.create({
      data: {
        name: 'Empresa Teste',
        fantasyName: 'Empresa Teste',
        document: `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 14),
        active: true,
        zipCode: '01310100',
        street: 'Av Paulista',
        number: '100',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        phone01: '11999999999',
        email01: `empresa-${Date.now()}@test.com`,
      },
    });

    await prisma.nfsProviderConfig.create({
      data: {
        companyId: company.id,
        vendor: 'giss',
        municipalRegistration: '12345',
        municipalCodeIbge: '3529401',
        serieRps: 'NFSE',
        environment: NfsProviderEnvironment.Demonstration,
        certFilePath: '/certs/x.pfx',
        certPasswordEnvVar: 'X_PASS',
        vendorConfig: { municipioSlug: 'demonstracao' },
      },
    });

    // Act
    const result = await sut.execute(company.id);

    // Assert
    expect(result.companyId).toBe(company.id);
    expect(result.vendor).toBe('giss');
  });
});
