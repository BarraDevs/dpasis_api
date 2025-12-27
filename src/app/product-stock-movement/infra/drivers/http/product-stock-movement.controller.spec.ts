import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { CreateProductStockMovementInputDto, CreateProductStockMovementOutputDto } from 'src/app/product-stock-movement/application/usecases/create-product-stock-movement/dtos/create-product-stock-movement.dto';
import { ProductStockMovementModule } from 'src/app/product-stock-movement/product-stock-movement.module';
import { ProductStockMovementController } from './product-stock-movement.controller';

describe('ProductStockMovementController', () => {
  let sut: ProductStockMovementController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ProductStockMovementModule,
      ],
    }).compile();

    sut = module.get(ProductStockMovementController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call execute with correct arguments', async() => {
      // Arrange
      const input = createMock<CreateProductStockMovementInputDto>();
      const output = createMock<CreateProductStockMovementOutputDto>();
      const createProductStockMovementService = jest.spyOn(sut['createProductStockMovementService'], 'execute').mockResolvedValueOnce(output);

      // Act
      const result = await sut.create(input);

      // Assert
      expect(createProductStockMovementService).toHaveBeenCalledWith(input);
      expect(result).toBe(output);
    });
  });
});
