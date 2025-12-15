import { Test } from '@nestjs/testing';
import { ProductPersistenceModule } from 'src/app/product/application/persistence/product-persistence.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProductDaoAdapterPrisma } from './product.dao';

describe('ProductDaoAdapterPrisma', () => {
  let sut: ProductDaoAdapterPrisma;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ProductPersistenceModule,
        ConfigModule,
      ],
      providers: [
        ProductDaoAdapterPrisma,
      ],
    }).compile();

    sut = module.get(ProductDaoAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.product.deleteMany();
  });

  afterEach(async() => {
    await prisma.product.deleteMany();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
