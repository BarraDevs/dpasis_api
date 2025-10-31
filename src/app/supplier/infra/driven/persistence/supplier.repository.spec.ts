import { Test } from '@nestjs/testing';
import { SupplierPersistenceModule } from 'src/app/supplier/application/persistence/supplier-persistence.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { SupplierDaoAdapterPrisma } from './supplier.dao';

describe('SupplierDaoAdapterPrisma', () => {
  let sut: SupplierDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        SupplierPersistenceModule,
        ConfigModule,
      ],
      providers: [
        SupplierDaoAdapterPrisma,
      ],
    }).compile();

    sut = module.get(SupplierDaoAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.supplier.deleteMany();
  });

  afterAll(async() => {
    await prisma.supplier.deleteMany();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
