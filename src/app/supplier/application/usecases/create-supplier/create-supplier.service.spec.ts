import { Test, TestingModule } from '@nestjs/testing';
import { SupplierModule } from 'src/app/supplier/supplier.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateSupplier } from './create-supplier.service';

describe('CreateSupplier', () => {
  let sut: CreateSupplier;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SupplierModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(CreateSupplier);
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
