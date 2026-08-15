import { Test } from '@nestjs/testing';
import { CompanyNfsConfigDto } from 'src/app/company/company-nfs-config/application/dtos/company-nfs-config.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CompanyNfsConfigDaoAdapterPrisma } from './company-nfs-config-prisma.dao';

async function seedCompany(prisma: PrismaService) {
  return prisma.company.create({
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
}

describe('CompanyNfsConfigDaoAdapterPrisma - Integration tests', () => {
  let sut: CompanyNfsConfigDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [CompanyNfsConfigDaoAdapterPrisma, PrismaService],
    }).compile();

    sut = module.get(CompanyNfsConfigDaoAdapterPrisma);
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

  describe('findByCompanyId', () => {
    it('should return null when the company has no nfs config', async() => {
      // Arrange
      const company = await seedCompany(prisma);

      // Act
      const result = await sut.findByCompanyId(company.id);

      // Assert
      expect(result).toBeNull();
    });

    it('should return the config with the complete DTO shape', async() => {
      // Arrange
      const company = await seedCompany(prisma);
      const created = await prisma.nfsProviderConfig.create({
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
          simpleNationalOptant: false,
          fiscalIncentive: false,
          issRate: 0.05,
          issExigibility: 1,
        },
      });

      // Act
      const result = await sut.findByCompanyId(company.id);

      // Assert
      expect(result).toMatchObject<CompanyNfsConfigDto>({
        id: created.id,
        companyId: company.id,
        vendor: 'giss',
        municipalRegistration: '12345',
        municipalCodeIbge: '3529401',
        serieRps: 'NFSE',
        environment: NfsProviderEnvironment.Demonstration,
        certFilePath: '/certs/x.pfx',
        certPasswordEnvVar: 'X_PASS',
        vendorConfig: { municipioSlug: 'demonstracao' },
        simpleNationalOptant: false,
        fiscalIncentive: false,
        issRate: 0.05,
        issExigibility: 1,
      });
    });
  });

  describe('save and edit', () => {
    it('should persist and update nfs config', async() => {
      // Arrange
      const company = await seedCompany(prisma);

      // Act
      const id = await sut.save({
        companyId: company.id,
        vendor: 'giss',
        municipalRegistration: '12345',
        municipalCodeIbge: '3529401',
        serieRps: 'NFSE',
        environment: NfsProviderEnvironment.Demonstration,
        certFilePath: '/certs/x.pfx',
        certPasswordEnvVar: 'X_PASS',
        vendorConfig: { municipioSlug: 'demonstracao' },
        simpleNationalOptant: false,
        fiscalIncentive: false,
        issRate: 0.05,
        issExigibility: 1,
      });

      await sut.edit(id, { serieRps: 'NFSE2' });

      // Assert
      const result = await sut.findById(id);
      expect(result?.serieRps).toBe('NFSE2');
    });
  });
});
