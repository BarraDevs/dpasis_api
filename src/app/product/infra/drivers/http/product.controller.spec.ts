import { Test } from '@nestjs/testing';
import { ProductModule } from 'src/app/product/product.module';
import { ProductController } from './product.controller';

describe('ProductController', () => {
  let sut: ProductController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ProductModule,
      ],
    }).compile();

    sut = module.get(ProductController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });
});
