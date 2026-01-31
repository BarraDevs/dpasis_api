import { Test, TestingModule } from '@nestjs/testing';
import { ProductStockMovementModule } from 'src/app/product-stock-movement/product-stock-movement.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateProductStockMovement } from './create-product-stock-movement.service';

describe('CreateProductStockMovement', () => {
  let sut: CreateProductStockMovement;
  let prisma: PrismaService;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ProductStockMovementModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(CreateProductStockMovement);
    prisma = module.get(PrismaService);

    await prisma.truncate();
  });

  afterEach(async() => {
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
