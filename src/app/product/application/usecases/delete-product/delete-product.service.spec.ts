import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { ProductNotFoundError } from 'src/app/product/domain/errors/product-not-found.error';
import { ProductModule } from 'src/app/product/product.module';
import { CreateSupplier } from 'src/app/supplier/application/usecases/create-supplier/create-supplier.service';
import { SupplierModule } from 'src/app/supplier/supplier.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProductDto } from '../../dtos/product.dto';
import { CreateProduct } from '../create-product/create-product.service';
import { CreateProductInputDto } from '../create-product/dtos/create-product.dto';
import { FindProductById } from '../find-product-by-id/find-product-by-id.service';
import { DeleteProduct } from './delete-product.service';

describe('DeleteProduct', () => {
  let sut: DeleteProduct;
  let prisma: PrismaService;
  let createProduct: CreateProduct;
  let findProductById: FindProductById;
  let createCompany: CreateCompany;
  let createSupplier: CreateSupplier;
  let companyId: string;
  let supplierId: string;
  let data: CreateProductInputDto;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ProductModule,
        SupplierModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(DeleteProduct);
    prisma = module.get(PrismaService);
    createProduct = module.get(CreateProduct);
    findProductById = module.get(FindProductById);
    createCompany = module.get(CreateCompany);
    createSupplier = module.get(CreateSupplier);

    await prisma.productStockMovement.deleteMany();
    await prisma.product.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.company.deleteMany();

    companyId = (await createCompany.execute({
      name: 'Test Company',
      fantasyName: 'Company',
      document: '61067756000142',
      ie: '111111111',
      zipCode: '12345678',
      street: 'Test Street',
      number: '100',
      neighborhood: 'District',
      city: 'City',
      state: 'ST',
      phone01: '1111111111',
      cellphone: null,
      phone02: null,
      email01: 'company@test.com',
      email02: null,
      complement: null,
      reference: null,
    })).id;

    supplierId = (await createSupplier.execute({
      cnpj: '11222333000181',
      ie: '123456789',
      group: 'Grupo Teste',
      type: 'Nacional',
      companyName: 'Supplier Company',
      fantasyName: 'Supplier Fantasy',
      representative: 'Representante Teste',
      companyIds: [companyId],
    })).id;

    data = {
      companyId,
      type: 'Produto Tipo',
      group01: 'Grupo 01',
      group02: 'Grupo 02',
      description: 'Descrição do produto teste',
      complement: 'Complemento do produto',
      manufacturerCode: 'MANUF001',
      brand: 'Marca Teste',
      measureUnit: 'UN',
      ncm: '12345678',
      economicBatch: 'BATCH001',
      minimumStock: 10,
      maximumStock: 100,
      warrantyDays: 365,
      weightInKg: 1.5,
      heightInCm: 10,
      lengthInCm: 20,
      widthInCm: 15,
      markup: 30,
      marginB: 20,
      currency: 'BRL',
      exchangeRate: 1,
      unitCostInCents: 1000,
      unitPriceInCents: 1500,
      ean: '7891234567890',
      additionalInfo: 'Informações adicionais',
      supplierIds: [supplierId],
      images: ['https://example.com/image1.jpg'],
    };
  });

  afterEach(async() => {
    await prisma.productStockMovement.deleteMany();
    await prisma.product.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should throw an error if product is not found', async() => {
      // Arrange
      const findByIdSpy = jest.spyOn(sut['productDao'], 'findById').mockResolvedValue(null);
      const deleteSpy = jest.spyOn(sut['productRepository'], 'delete').mockResolvedValue();

      // Act & Assert
      expect.assertions(3);
      return sut.execute('non-existent-id').catch((error) => {
        expect(error).toBeInstanceOf(ProductNotFoundError);
        expect(findByIdSpy).toHaveBeenCalledWith('non-existent-id');
        expect(deleteSpy).not.toHaveBeenCalled();
      });
    });

    it('should call repository delete method with correct id', async() => {
      // Arrange
      const productData = createMock<ProductDto>({ id: 'product-id' });
      jest.spyOn(sut['productDao'], 'findById').mockResolvedValue(productData);
      const deleteSpy = jest.spyOn(sut['productRepository'], 'delete').mockResolvedValue();

      // Act
      await sut.execute('product-id');

      // Assert
      expect(deleteSpy).toHaveBeenCalledWith('product-id');
    });
  });

  describe('integration tests', () => {
    it('should throw an error if product is not found', async() => {
      // Act & Assert
      expect.assertions(1);
      return sut.execute('non-existent-id').catch((error) => {
        expect(error).toBeInstanceOf(ProductNotFoundError);
      });
    });

    it('should delete a product successfully', async() => {
      // Arrange
      const product = await createProduct.execute(data);

      // Act
      await sut.execute(product.id);

      // Assert
      expect.assertions(1);
      return findProductById.execute(product.id).catch((error) => {
        expect(error).toBeInstanceOf(ProductNotFoundError);
      });
    });

    it('should return success message', async() => {
      // Arrange
      const product = await createProduct.execute(data);

      // Act
      const result = await sut.execute(product.id);

      // Assert
      expect(result.message).toBe('Produto deletado com sucesso!');
    });

    it('should delete product and remove supplier association', async() => {
      // Arrange
      const product = await createProduct.execute(data);

      // Act
      await sut.execute(product.id);

      // Assert - Verify supplier still exists
      const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
      expect(supplier).not.toBeNull();
    });

    it('should not affect other products when deleting one', async() => {
      // Arrange
      const product1 = await createProduct.execute(data);
      const product2 = await createProduct.execute({
        ...data,
        ean: '7891234567891',
        manufacturerCode: 'MANUF002',
      });

      // Act
      await sut.execute(product1.id);

      // Assert
      const remainingProduct = await findProductById.execute(product2.id);
      expect(remainingProduct).toBeDefined();
      expect(remainingProduct.id).toBe(product2.id);
    });

    it('should delete product with multiple suppliers', async() => {
      // Arrange
      const supplier2Id = (await createSupplier.execute({
        cnpj: '96588142000190',
        ie: '987654321',
        group: 'Grupo Teste 2',
        type: 'Internacional',
        companyName: 'Supplier Company 2',
        fantasyName: 'Supplier Fantasy 2',
        representative: 'Representante Teste 2',
        companyIds: [companyId],
      })).id;

      const dataWithMultipleSuppliers: CreateProductInputDto = {
        ...data,
        supplierIds: [supplierId, supplier2Id],
      };

      const product = await createProduct.execute(dataWithMultipleSuppliers);

      // Act
      await sut.execute(product.id);

      // Assert
      expect.assertions(1);
      return findProductById.execute(product.id).catch((error) => {
        expect(error).toBeInstanceOf(ProductNotFoundError);
      });
    });

    it('should delete product without suppliers', async() => {
      // Arrange
      const dataWithoutSuppliers: CreateProductInputDto = {
        ...data,
        supplierIds: [],
      };

      const product = await createProduct.execute(dataWithoutSuppliers);

      // Act
      await sut.execute(product.id);

      // Assert
      expect.assertions(1);
      return findProductById.execute(product.id).catch((error) => {
        expect(error).toBeInstanceOf(ProductNotFoundError);
      });
    });

    it('should delete product with stock movements (cascade delete)', async() => {
      // Arrange
      const product = await createProduct.execute(data);

      // Create stock movements
      await prisma.productStockMovement.createMany({
        data: [
          {
            productId: product.id,
            type: 'IN',
            quantity: 10,
            unitPriceInCents: 1000,
          },
          {
            productId: product.id,
            type: 'OUT',
            quantity: 5,
            unitPriceInCents: 1000,
          },
        ],
      });

      // Verify stock movements were created
      const movementsBefore = await prisma.productStockMovement.findMany({
        where: { productId: product.id },
      });
      expect(movementsBefore).toHaveLength(2);

      // Act
      await sut.execute(product.id);

      // Assert - Product should be deleted
      expect.assertions(3);
      const movementsAfter = await prisma.productStockMovement.findMany({
        where: { productId: product.id },
      });
      expect(movementsAfter).toHaveLength(0);

      return findProductById.execute(product.id).catch((error) => {
        expect(error).toBeInstanceOf(ProductNotFoundError);
      });
    });

    it('should delete product with images', async() => {
      // Arrange
      const dataWithImages: CreateProductInputDto = {
        ...data,
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
        ],
      };

      const product = await createProduct.execute(dataWithImages);

      // Act
      await sut.execute(product.id);

      // Assert
      expect.assertions(1);
      return findProductById.execute(product.id).catch((error) => {
        expect(error).toBeInstanceOf(ProductNotFoundError);
      });
    });

    it('should not affect company when deleting product', async() => {
      // Arrange
      const product = await createProduct.execute(data);

      // Act
      await sut.execute(product.id);

      // Assert
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      expect(company).not.toBeNull();
    });

    it('should handle delete of product with optional fields as null', async() => {
      // Arrange
      const dataWithNulls: CreateProductInputDto = {
        ...data,
        complement: null,
        additionalInfo: null,
      };

      const product = await createProduct.execute(dataWithNulls);

      // Act
      await sut.execute(product.id);

      // Assert
      expect.assertions(1);
      return findProductById.execute(product.id).catch((error) => {
        expect(error).toBeInstanceOf(ProductNotFoundError);
      });
    });
  });
});
