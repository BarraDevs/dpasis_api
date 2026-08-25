import { Test } from '@nestjs/testing';
import { CompanyNfsConfigModule } from 'src/app/company/company-nfs-config/company-nfs-config.module';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateCompanyNfsConfig } from './create-company-nfs-config.service';
import { CreateCompanyNfsConfigInputDto } from './dtos/create-company-nfs-config.dto';

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

describe('CreateCompanyNfsConfig - Integration tests', () => {
  let sut: CreateCompanyNfsConfig;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CompanyNfsConfigModule],
    }).compile();

    sut = module.get(CreateCompanyNfsConfig);
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

  it('should create nfs config and return id', async() => {
    // Arrange
    const company = await seedCompany(prisma);
    const input: CreateCompanyNfsConfigInputDto = {
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
      municipalTaxCode: '010700',
    };

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result.id).toBeDefined();
    const saved = await prisma.nfsProviderConfig.findUnique({ where: { id: result.id } });
    expect(saved?.companyId).toBe(company.id);
    expect(saved?.vendor).toBe('giss');
  });
});
