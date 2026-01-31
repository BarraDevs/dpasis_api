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
import { FindProductById } from './find-product-by-id.service';

describe('FindProductById', () => {
  let sut: FindProductById;
  let prisma: PrismaService;
  let createProduct: CreateProduct;
  let createCompany: CreateCompany;
  let createSupplier: CreateSupplier;
  let companyId: string;
  let supplierId: string;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ProductModule,
        SupplierModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindProductById);
    prisma = module.get(PrismaService);
    createProduct = module.get(CreateProduct);
    createCompany = module.get(CreateCompany);
    createSupplier = module.get(CreateSupplier);

    await prisma.truncate();

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
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should throw an error if product is not found', async() => {
      // Arrange
      const findByIdSpy = jest.spyOn(sut['productDao'], 'findById').mockResolvedValue(null);

      // Act & Assert
      expect.assertions(2);
      return sut.execute('non-existent-id').catch((error) => {
        expect(error).toBeInstanceOf(ProductNotFoundError);
        expect(findByIdSpy).toHaveBeenCalledWith('non-existent-id');
      });
    });

    it('should return the product if found', async() => {
      // Arrange
      const productData = createMock<ProductDto>();
      const findByIdSpy = jest.spyOn(sut['productDao'], 'findById').mockResolvedValue(productData);

      // Act
      const result = await sut.execute('product-id');

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith('product-id');
      expect(result).toEqual(productData);
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

    it('should return the product if found', async() => {
      // Arrange
      const data: CreateProductInputDto = {
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

      const createResult = await createProduct.execute(data);

      // Act
      const result = await sut.execute(createResult.id);

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual<ProductDto>({
        id: createResult.id,
        companyId: data.companyId,
        type: data.type,
        group01: data.group01,
        group02: data.group02,
        description: data.description,
        complement: data.complement ?? null,
        manufacturerCode: data.manufacturerCode,
        brand: data.brand,
        measureUnit: data.measureUnit,
        ncm: data.ncm,
        economicBatch: data.economicBatch,
        minimumStock: data.minimumStock,
        maximumStock: data.maximumStock,
        currentStock: 0,
        warrantyDays: data.warrantyDays,
        weightInKg: data.weightInKg,
        heightInCm: data.heightInCm,
        lengthInCm: data.lengthInCm,
        widthInCm: data.widthInCm,
        markup: data.markup,
        marginB: data.marginB,
        currency: data.currency,
        exchangeRate: data.exchangeRate,
        unitCostInCents: data.unitCostInCents,
        unitPriceInCents: data.unitPriceInCents,
        ean: data.ean,
        additionalInfo: data.additionalInfo ?? null,
        images: data.images,
        suppliers: expect.arrayContaining([
          expect.objectContaining({
            id: supplierId,
          }),
        ]),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should return product with null optional fields', async() => {
      // Arrange
      const data: CreateProductInputDto = {
        companyId,
        type: 'Produto Tipo',
        group01: 'Grupo 01',
        group02: 'Grupo 02',
        description: 'Descrição do produto teste',
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
        supplierIds: [],
        images: [],
        complement: null,
        additionalInfo: null,
      };

      const createResult = await createProduct.execute(data);

      // Act
      const result = await sut.execute(createResult.id);

      // Assert
      expect(result).toBeDefined();
      expect(result.complement).toBeNull();
      expect(result.additionalInfo).toBeNull();
    });

    it('should return product with empty suppliers array', async() => {
      // Arrange
      const data: CreateProductInputDto = {
        companyId,
        type: 'Produto Tipo',
        group01: 'Grupo 01',
        group02: 'Grupo 02',
        description: 'Descrição do produto teste',
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
        supplierIds: [],
        images: [],
        complement: null,
        additionalInfo: null,
      };

      const createResult = await createProduct.execute(data);

      // Act
      const result = await sut.execute(createResult.id);

      // Assert
      expect(result).toBeDefined();
      expect(result.suppliers).toHaveLength(0);
    });

    it('should return product with multiple suppliers', async() => {
      // Arrange
      const supplier2Id = (await createSupplier.execute({
        cnpj: '46735327000102',
        ie: '987654321',
        group: 'Grupo Teste 2',
        type: 'Internacional',
        companyName: 'Supplier Company 2',
        fantasyName: 'Supplier Fantasy 2',
        representative: 'Representante Teste 2',
        companyIds: [companyId],
      })).id;

      const data: CreateProductInputDto = {
        companyId,
        type: 'Produto Tipo',
        group01: 'Grupo 01',
        group02: 'Grupo 02',
        description: 'Descrição do produto teste',
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
        supplierIds: [supplierId, supplier2Id],
        images: [],
        complement: null,
        additionalInfo: null,
      };

      const createResult = await createProduct.execute(data);

      // Act
      const result = await sut.execute(createResult.id);

      // Assert
      expect(result).toBeDefined();
      expect(result.suppliers).toHaveLength(2);
      expect(result.suppliers.map(s => s.id)).toContain(supplierId);
      expect(result.suppliers.map(s => s.id)).toContain(supplier2Id);
    });

    it('should return product with multiple images', async() => {
      // Arrange
      const images = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
      ];

      const data: CreateProductInputDto = {
        companyId,
        type: 'Produto Tipo',
        group01: 'Grupo 01',
        group02: 'Grupo 02',
        description: 'Descrição do produto teste',
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
        supplierIds: [],
        images,
        complement: null,
        additionalInfo: null,
      };

      const createResult = await createProduct.execute(data);

      // Act
      const result = await sut.execute(createResult.id);

      // Assert
      expect(result).toBeDefined();
      expect(result.images).toHaveLength(3);
      expect(result.images).toEqual(images);
    });

    it('should return product with correct supplier dto structure', async() => {
      // Arrange
      const data: CreateProductInputDto = {
        companyId,
        type: 'Produto Tipo',
        group01: 'Grupo 01',
        group02: 'Grupo 02',
        description: 'Descrição do produto teste',
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
        supplierIds: [supplierId],
        images: [],
        complement: null,
        additionalInfo: null,
      };

      const createResult = await createProduct.execute(data);

      // Act
      const result = await sut.execute(createResult.id);

      // Assert
      expect(result).toBeDefined();
      expect(result.suppliers[0]).toHaveProperty('id');
      expect(result.suppliers[0]).toHaveProperty('companyName');
      expect(result.suppliers[0]).toHaveProperty('fantasyName');
      expect(result.suppliers[0].companyName).toBe('Supplier Company');
      expect(result.suppliers[0].fantasyName).toBe('Supplier Fantasy');
    });
  });
});
