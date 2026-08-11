import { Test } from '@nestjs/testing';
import { CompanyNfsConfigModule } from 'src/app/company/company-nfs-config/company-nfs-config.module';
import { NfsProviderEnvironment } from 'src/infra/nfs-generation/dtos/nfs-provider-credentials.dto';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { EditCompanyNfsConfig } from './edit-company-nfs-config.service';

async function seedCompanyWithConfig(prisma: PrismaService) {
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

  const config = await prisma.nfsProviderConfig.create({
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

  return { company, config };
}

describe('EditCompanyNfsConfig - Integration tests', () => {
  let sut: EditCompanyNfsConfig;
  let prisma: PrismaService;

  beforeAll(async() => {
    const module = await Test.createTestingModule({
      imports: [CompanyNfsConfigModule],
    }).compile();

    sut = module.get(EditCompanyNfsConfig);
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

  it('should update nfs config in database', async() => {
    // Arrange
    const { config } = await seedCompanyWithConfig(prisma);

    // Act
    await sut.execute(config.id, { serieRps: 'NFSE2' });

    // Assert
    const updated = await prisma.nfsProviderConfig.findUnique({ where: { id: config.id } });
    expect(updated?.serieRps).toBe('NFSE2');
  });
});
