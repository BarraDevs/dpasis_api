import { Test, TestingModule } from '@nestjs/testing';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { Product } from 'src/app/product/domain/entities/product.entity';
import { ProductModule } from 'src/app/product/product.module';
import { CreateSupplier } from 'src/app/supplier/application/usecases/create-supplier/create-supplier.service';
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
  });
});
