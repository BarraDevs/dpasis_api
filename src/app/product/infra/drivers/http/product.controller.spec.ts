import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ProductDto } from 'src/app/product/application/dtos/product.dto';
import { CreateProductInputDto, CreateProductOutputDto } from 'src/app/product/application/usecases/create-product/dtos/create-product.dto';
import { EditProductInputDto } from 'src/app/product/application/usecases/edit-product/dtos/edit-product.dto';
import { FindAllProductQueryDto } from 'src/app/product/application/usecases/find-all-product/dtos/find-all-product.dto';
import { ProductModule } from 'src/app/product/product.module';
import { ConfigModule } from 'src/core/config/config.module';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ProductController } from './product.controller';

describe('ProductController', () => {
  let sut: ProductController;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ProductModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(ProductController);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('create', () => {
    it('should call createProductService with correct parameters', async() => {
      // Arrange
      const input = createMock<CreateProductInputDto>();
      const output = createMock<CreateProductOutputDto>();
      const createProductSpy = jest.spyOn(sut['createProductService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.create(input);

      // Assert
      expect(createProductSpy).toHaveBeenCalledWith(input);
      expect(result).toEqual(output);
    });

    it('should return the created product id', async() => {
      // Arrange
      const input = createMock<CreateProductInputDto>();
      const output: CreateProductOutputDto = { id: 'new-product-id' };
      jest.spyOn(sut['createProductService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.create(input);

      // Assert
      expect(result.id).toBe('new-product-id');
    });
  });

  describe('findAll', () => {
    it('should call findAllProductService with correct parameters', async() => {
      // Arrange
      const queries = createMock<FindAllProductQueryDto>();
      const output = createMock<IPagination<ProductDto>>();
      const findAllProductSpy = jest.spyOn(sut['findAllProductService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(findAllProductSpy).toHaveBeenCalledWith(queries);
      expect(result).toEqual(output);
    });

    it('should return paginated products', async() => {
      // Arrange
      const queries = createMock<FindAllProductQueryDto>();
      const mockProducts = [createMock<ProductDto>(), createMock<ProductDto>()];
      const output: IPagination<ProductDto> = {
        data: mockProducts,
        totalItems: 2,
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: 1,
      };
      jest.spyOn(sut['findAllProductService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findAll(queries);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.totalItems).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should call findProductByIdService with correct parameters', async() => {
      // Arrange
      const params: Params = { id: 'product-id' };
      const output = createMock<ProductDto>();
      const findProductByIdSpy = jest.spyOn(sut['findProductByIdService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(findProductByIdSpy).toHaveBeenCalledWith(params.id);
      expect(result).toEqual(output);
    });

    it('should return the product when found', async() => {
      // Arrange
      const params: Params = { id: 'product-id' };
      const output: ProductDto = {
        id: 'product-id',
        companyId: 'company-id',
        type: 'Eletrônico',
        group01: 'Informática',
        group02: 'Computadores',
        description: 'Notebook',
        complement: null,
        manufacturerCode: 'DELL-001',
        brand: 'Dell',
        measureUnit: 'UN',
        ncm: '84713012',
        economicBatch: 'BATCH001',
        minimumStock: 5,
        maximumStock: 50,
        currentStock: 20,
        warrantyDays: 365,
        weightInKg: 2.5,
        heightInCm: 3.0,
        lengthInCm: 35.0,
        widthInCm: 25.0,
        markup: 30,
        marginB: 20,
        currency: 'BRL',
        exchangeRate: 1.0,
        unitCostInCents: 350000,
        unitPriceInCents: 450000,
        ean: '7891234567890',
        additionalInfo: null,
        images: [],
        suppliers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.spyOn(sut['findProductByIdService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.findOne(params);

      // Assert
      expect(result.id).toBe('product-id');
      expect(result.description).toBe('Notebook');
    });
  });

  describe('update', () => {
    it('should call editProductService with correct parameters', async() => {
      // Arrange
      const params: Params = { id: 'product-id' };
      const body = createMock<EditProductInputDto>();
      const output = createMock<SuccessMessage>();
      const editProductSpy = jest.spyOn(sut['editProductService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(editProductSpy).toHaveBeenCalledWith(params.id, body);
      expect(result).toEqual(output);
    });

    it('should return success message after update', async() => {
      // Arrange
      const params: Params = { id: 'product-id' };
      const body = createMock<EditProductInputDto>();
      const output: SuccessMessage = { message: 'Produto editado com sucesso!' };
      jest.spyOn(sut['editProductService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.update(params, body);

      // Assert
      expect(result.message).toBe('Produto editado com sucesso!');
    });
  });

  describe('remove', () => {
    it('should call deleteProductService with correct parameters', async() => {
      // Arrange
      const params: Params = { id: 'product-id' };
      const output = createMock<SuccessMessage>();
      const deleteProductSpy = jest.spyOn(sut['deleteProductService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.remove(params);

      // Assert
      expect(deleteProductSpy).toHaveBeenCalledWith(params.id);
      expect(result).toEqual(output);
    });

    it('should return success message after delete', async() => {
      // Arrange
      const params: Params = { id: 'product-id' };
      const output: SuccessMessage = { message: 'Produto deletado com sucesso!' };
      jest.spyOn(sut['deleteProductService'], 'execute').mockResolvedValue(output);

      // Act
      const result = await sut.remove(params);

      // Assert
      expect(result.message).toBe('Produto deletado com sucesso!');
    });
  });
});
