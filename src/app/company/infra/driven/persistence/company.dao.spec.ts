import { Test } from '@nestjs/testing';
import { CompanyPersistenceModule } from 'src/app/company/application/persistence/company-persistence.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CompanyDaoAdapterPrisma } from './company.dao';

describe('CompanyDaoAdapterPrisma', () => {
  let sut: CompanyDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        CompanyPersistenceModule,
        ConfigModule,
      ],
      providers: [
        CompanyDaoAdapterPrisma,
      ],
    }).compile();

    sut = module.get(CompanyDaoAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.company.deleteMany();
  });

  afterAll(async() => {
    await prisma.company.deleteMany();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
