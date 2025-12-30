import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { Product } from 'src/app/product/domain/entities/product.entity';
import { ProductDuplicateEanError } from 'src/app/product/domain/errors/duplicate-ean.error';
import { ProductModule } from 'src/app/product/product.module';
import { CreateSupplier } from 'src/app/supplier/application/usecases/create-supplier/create-supplier.service';
import { SupplierNotFoundError } from 'src/app/supplier/domain/errors/supplier-not-found.error';
import { SupplierModule } from 'src/app/supplier/supplier.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProductDto } from '../../dtos/product.dto';
import { FindProductById } from '../find-product-by-id/find-product-by-id.service';
import { CreateProduct } from './create-product.service';
import { CreateProductInputDto, CreateProductOutputDto } from './dtos/create-product.dto';

describe('CreateProduct', () => {
  let sut: CreateProduct;
  let prisma: PrismaService;
  let findProductById: FindProductById;
  let createCompany: CreateCompany;
  let createSupplier: CreateSupplier;
  let data: CreateProductInputDto;
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

    sut = module.get(CreateProduct);
    findProductById = module.get(FindProductById);
    prisma = module.get(PrismaService);
    createCompany = module.get(CreateCompany);
    createSupplier = module.get(CreateSupplier);

    await prisma.product.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.company.deleteMany();

    companyId = (await createCompany.execute({
      name: 'name teste',
      fantasyName: 'fantasyName teste',
      document: '61067756000142',
      ie: 'ie teste',
      zipCode: 'zipCode teste',
      street: 'street teste',
      number: 'number teste',
      neighborhood: 'neighborhood teste',
      complement: null,
      reference: null,
      city: 'city teste',
      state: 'state teste',
      cellphone: '2299887766',
      phone01: '3399887766',
      phone02: null,
      email01: 'email01@teste.com',
      email02: 'email02@teste.com',
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
    await prisma.product.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should throw an error if company does not exist', async() => {
      // Arrange
      const invalidData = { ...data, companyId: 'non-existent-company-id' };
      const saveSpy = jest.spyOn(sut['productRepo'], 'save').mockResolvedValue();

      // Act & Assert
      expect.assertions(2);
      return sut.execute(invalidData).catch((error) => {
        expect(error).toBeInstanceOf(CompanyNotFoundError);
        expect(saveSpy).not.toHaveBeenCalled();
      });
    });

    it('should throw an error if EAN is duplicate for the same company', async() => {
      // Arrange
      const productData = createMock<ProductDto>();
      const findByEanSpy = jest.spyOn(sut['productDao'], 'findByEan').mockResolvedValue(productData);
      const saveSpy = jest.spyOn(sut['productRepo'], 'save').mockResolvedValue();

      // Act & Assert
      expect.assertions(3);
      return sut.execute(data).catch((error) => {
        expect(error).toBeInstanceOf(ProductDuplicateEanError);
        expect(findByEanSpy).toHaveBeenCalledWith(data.ean, data.companyId);
        expect(saveSpy).not.toHaveBeenCalled();
      });
    });

    it('should throw an error if a supplier does not exist', async() => {
      // Arrange
      const invalidData = { ...data, supplierIds: ['non-existent-supplier-id'] };
      const findByEanSpy = jest.spyOn(sut['productDao'], 'findByEan').mockResolvedValue(null);
      const saveSpy = jest.spyOn(sut['productRepo'], 'save').mockResolvedValue();

      // Act & Assert
      expect.assertions(3);
      return sut.execute(invalidData).catch((error) => {
        expect(error).toBeInstanceOf(SupplierNotFoundError);
        expect(findByEanSpy).toHaveBeenCalledWith(data.ean, data.companyId);
        expect(saveSpy).not.toHaveBeenCalled();
      });
    });

    it('should create a product and return its id', async() => {
      // Arrange
      const saveSpy = jest.spyOn(sut['productRepo'], 'save').mockResolvedValue();

      // Act
      const result = await sut.execute(data);

      // Assert
      expect(saveSpy).toHaveBeenCalledWith(expect.any(Product));
      expect(result).toEqual<CreateProductOutputDto>({ id: result.id });
    });
  });

  describe('integration tests', () => {
    it('should throw an error if company does not exist', async() => {
      // Arrange
      const invalidData = { ...data, companyId: 'non-existent-company-id' };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(invalidData).catch((error) => {
        expect(error).toBeInstanceOf(CompanyNotFoundError);
      });
    });

    it('should persist the product in the database', async() => {
      // Act
      const createResult = await sut.execute(data);
      const productDto = await findProductById.execute(createResult.id);

      // Assert
      expect(productDto).toBeDefined();
      expect(productDto).toEqual<ProductDto>({
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
        currentStock: 0, // Always 0 when created
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

    it('should persist the product with null optional fields', async() => {
      // Arrange
      const minimalData: CreateProductInputDto = {
        ...data,
        complement: null,
        additionalInfo: null,
      };

      // Act
      const createResult = await sut.execute(minimalData);
      const productDto = await findProductById.execute(createResult.id);

      // Assert
      expect(productDto).toBeDefined();
      expect(productDto.complement).toBeNull();
      expect(productDto.additionalInfo).toBeNull();
    });

    it('should persist the product without suppliers', async() => {
      // Arrange
      const dataWithoutSuppliers: CreateProductInputDto = {
        ...data,
        supplierIds: [],
      };

      // Act
      const createResult = await sut.execute(dataWithoutSuppliers);
      const productDto = await findProductById.execute(createResult.id);

      // Assert
      expect(productDto).toBeDefined();
      expect(productDto.suppliers).toHaveLength(0);
    });

    it('should persist the product with multiple suppliers', async() => {
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

      // Act
      const createResult = await sut.execute(dataWithMultipleSuppliers);
      const productDto = await findProductById.execute(createResult.id);

      // Assert
      expect(productDto).toBeDefined();
      expect(productDto.suppliers).toHaveLength(2);
      expect(productDto.suppliers.map(s => s.id)).toContain(supplierId);
      expect(productDto.suppliers.map(s => s.id)).toContain(supplier2Id);
    });

    it('should persist the product with multiple images', async() => {
      // Arrange
      const dataWithMultipleImages: CreateProductInputDto = {
        ...data,
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
        ],
      };

      // Act
      const createResult = await sut.execute(dataWithMultipleImages);
      const productDto = await findProductById.execute(createResult.id);

      // Assert
      expect(productDto).toBeDefined();
      expect(productDto.images).toHaveLength(3);
      expect(productDto.images).toEqual(dataWithMultipleImages.images);
    });

    it('should persist the product with empty images array', async() => {
      // Arrange
      const dataWithNoImages: CreateProductInputDto = {
        ...data,
        images: [],
      };

      // Act
      const createResult = await sut.execute(dataWithNoImages);
      const productDto = await findProductById.execute(createResult.id);

      // Assert
      expect(productDto).toBeDefined();
      expect(productDto.images).toHaveLength(0);
    });

    it('should persist the product with currentStock as 0', async() => {
      // Act
      const createResult = await sut.execute(data);
      const productDto = await findProductById.execute(createResult.id);

      // Assert
      expect(productDto).toBeDefined();
      expect(productDto.currentStock).toBe(0);
    });

    it('should throw an error if EAN is duplicate for the same company', async() => {
      // Arrange
      await sut.execute(data);

      // Act & Assert
      expect.assertions(1);
      return sut.execute(data).catch((error) => {
        expect(error).toBeInstanceOf(ProductDuplicateEanError);
      });
    });

    it('should throw an error if one of the suppliers does not exist', async() => {
      // Arrange
      const invalidData = {
        ...data,
        supplierIds: [supplierId, 'non-existent-supplier-id'],
      };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(invalidData).catch((error) => {
        expect(error).toBeInstanceOf(SupplierNotFoundError);
      });
    });

    it('should persist the product with minimum stock values', async() => {
      // Arrange
      const dataWithMinValues: CreateProductInputDto = {
        ...data,
        minimumStock: 0,
        maximumStock: 0,
        warrantyDays: 0,
        weightInKg: 0,
        heightInCm: 0,
        lengthInCm: 0,
        widthInCm: 0,
        markup: 0,
        marginB: 0,
        exchangeRate: 0,
        unitCostInCents: 0,
        unitPriceInCents: 0,
      };

      // Act
      const createResult = await sut.execute(dataWithMinValues);
      const productDto = await findProductById.execute(createResult.id);

      // Assert
      expect(productDto).toMatchObject({
        minimumStock: 0,
        maximumStock: 0,
        warrantyDays: 0,
        weightInKg: 0,
        heightInCm: 0,
        lengthInCm: 0,
        widthInCm: 0,
        markup: 0,
        marginB: 0,
        exchangeRate: 0,
        unitCostInCents: 0,
        unitPriceInCents: 0,
      });
    });

    it('should persist the product with large stock values', async() => {
      // Arrange
      const dataWithLargeValues: CreateProductInputDto = {
        ...data,
        minimumStock: 1000,
        maximumStock: 10000,
        warrantyDays: 3650, // 10 years
        weightInKg: 999.99,
        heightInCm: 500,
        lengthInCm: 1000,
        widthInCm: 800,
        markup: 100,
        marginB: 80,
        unitCostInCents: 1000000, // R$ 10,000.00
        unitPriceInCents: 2000000, // R$ 20,000.00
      };

      // Act
      const createResult = await sut.execute(dataWithLargeValues);
      const productDto = await findProductById.execute(createResult.id);

      // Assert
      expect(productDto).toMatchObject({
        minimumStock: 1000,
        maximumStock: 10000,
        warrantyDays: 3650,
        weightInKg: 999.99,
        heightInCm: 500,
        lengthInCm: 1000,
        widthInCm: 800,
        markup: 100,
        marginB: 80,
        unitCostInCents: 1000000,
        unitPriceInCents: 2000000,
      });
    });

    it('should persist the product with different currencies', async() => {
      // Arrange
      const currencies = ['BRL', 'USD', 'EUR'];

      for (const currency of currencies) {
        const dataWithCurrency: CreateProductInputDto = {
          ...data,
          ean: `EAN${currency}${Date.now()}`, // Unique EAN for each iteration
          currency,
          exchangeRate: currency === 'BRL' ? 1 : 5.5,
        };

        // Act
        const createResult = await sut.execute(dataWithCurrency);
        const productDto = await findProductById.execute(createResult.id);

        // Assert
        expect(productDto.currency).toBe(currency);
        expect(productDto.exchangeRate).toBe(dataWithCurrency.exchangeRate);
      }
    });

    it('should validate all suppliers exist before creating product', async() => {
      // Arrange
      const supplier2Id = (await createSupplier.execute({
        cnpj: '55967002000146',
        ie: '999888777',
        group: 'Grupo Validação',
        type: 'Nacional',
        companyName: 'Validation Supplier',
        fantasyName: 'Validation',
        representative: 'Rep Validation',
        companyIds: [companyId],
      })).id;

      const dataWith2Suppliers: CreateProductInputDto = {
        ...data,
        ean: `VALIDATION${Date.now()}`,
        supplierIds: [supplierId, supplier2Id],
      };

      // Act
      const createResult = await sut.execute(dataWith2Suppliers);
      const productDto = await findProductById.execute(createResult.id);

      // Assert
      expect(productDto.suppliers).toHaveLength(2);
      const supplierIds = productDto.suppliers.map(s => s.id);
      expect(supplierIds).toContain(supplierId);
      expect(supplierIds).toContain(supplier2Id);
    });

    it('should persist product with very long description', async() => {
      // Arrange
      const longDescription = 'A'.repeat(1000);
      const dataWithLongDescription: CreateProductInputDto = {
        ...data,
        ean: `LONGDESC${Date.now()}`,
        description: longDescription,
      };

      // Act
      const createResult = await sut.execute(dataWithLongDescription);
      const productDto = await findProductById.execute(createResult.id);

      // Assert
      expect(productDto.description).toBe(longDescription);
      expect(productDto.description.length).toBe(1000);
    });

    it('should persist product with decimal weight and dimensions', async() => {
      // Arrange
      const dataWithDecimals: CreateProductInputDto = {
        ...data,
        ean: `DECIMAL${Date.now()}`,
        weightInKg: 12.75,
        heightInCm: 25.5,
        lengthInCm: 38.25,
        widthInCm: 15.125,
        exchangeRate: 5.47,
      };

      // Act
      const createResult = await sut.execute(dataWithDecimals);
      const productDto = await findProductById.execute(createResult.id);

      // Assert
      expect(productDto.weightInKg).toBe(12.75);
      expect(productDto.heightInCm).toBe(25.5);
      expect(productDto.lengthInCm).toBe(38.25);
      expect(productDto.widthInCm).toBe(15.125);
      expect(productDto.exchangeRate).toBe(5.47);
    });

    it('should allow the same EAN for different companies', async() => {
      // Arrange
      const company2Id = (await createCompany.execute({
        name: 'Second Company',
        fantasyName: 'Second Fantasy',
        document: '88.202.511/0001-37',
        ie: 'IE Second',
        zipCode: '12345678',
        street: 'Second Street',
        number: '200',
        neighborhood: 'Second Neighborhood',
        complement: null,
        reference: null,
        city: 'Second City',
        state: 'SP',
        cellphone: '2199887766',
        phone01: '2133445566',
        phone02: null,
        email01: 'second@company.com',
        email02: null,
      })).id;

      const supplier2Id = (await createSupplier.execute({
        cnpj: '26.970.311/0001-77',
        ie: '987654321',
        group: 'Cross Company Group',
        type: 'Nacional',
        companyName: 'Cross Company Supplier',
        fantasyName: 'Cross Supplier',
        representative: 'Cross Rep',
        companyIds: [company2Id],
      })).id;

      const productCompany1: CreateProductInputDto = {
        ...data,
        ean: '7899000000018',
      };

      const productCompany2: CreateProductInputDto = {
        ...data,
        companyId: company2Id,
        ean: '7899000000018', // Same EAN as company 1
        supplierIds: [supplier2Id],
      };

      // Act
      const result1 = await sut.execute(productCompany1);
      const result2 = await sut.execute(productCompany2);

      const product1 = await findProductById.execute(result1.id);
      const product2 = await findProductById.execute(result2.id);

      // Assert
      expect(product1).toBeDefined();
      expect(product2).toBeDefined();
      expect(product1.ean).toBe('7899000000018');
      expect(product2.ean).toBe('7899000000018');
      expect(product1.companyId).toBe(companyId);
      expect(product2.companyId).toBe(company2Id);
    });
  });
});
