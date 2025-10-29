import { Test } from '@nestjs/testing';
import { LicensePersistenceModule } from 'src/app/license/application/persistence/license-persistence.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { LicenseDaoAdapterPrisma } from './license.dao';

describe('LicenseDaoAdapterPrisma', () => {
  let sut: LicenseDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        LicensePersistenceModule,
        ConfigModule,
      ],
      providers: [
        LicenseDaoAdapterPrisma,
      ],
    }).compile();

    sut = module.get(LicenseDaoAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.license.deleteMany();
  });

  afterAll(async() => {
    await prisma.license.deleteMany();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
