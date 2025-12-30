import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { ProductDuplicateEanError } from 'src/app/product/domain/errors/duplicate-ean.error';
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
import { EditProductInputDto } from './dtos/edit-product.dto';
import { EditProduct } from './edit-product.service';

describe('EditProduct', () => {
  let sut: EditProduct;
  let prisma: PrismaService;
  let createProduct: CreateProduct;
  let findProductById: FindProductById;
  let createCompany: CreateCompany;
  let createSupplier: CreateSupplier;
  let companyId: string;
  let supplierId: string;
  let supplierId2: string;
  let data: CreateProductInputDto;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ProductModule,
        SupplierModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(EditProduct);
    prisma = module.get(PrismaService);
    createProduct = module.get(CreateProduct);
    findProductById = module.get(FindProductById);
    createCompany = module.get(CreateCompany);
    createSupplier = module.get(CreateSupplier);

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
      companyName: 'Supplier Company 1',
      fantasyName: 'Supplier Fantasy 1',
      representative: 'Representante Teste',
      companyIds: [companyId],
    })).id;

    supplierId2 = (await createSupplier.execute({
      cnpj: '96588142000190',
      ie: '987654321',
      group: 'Grupo Teste 2',
      type: 'Internacional',
      companyName: 'Supplier Company 2',
      fantasyName: 'Supplier Fantasy 2',
      representative: 'Representante Teste 2',
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
    it('should throw an error if product is not found', async() => {
      // Arrange
      const findByIdSpy = jest.spyOn(sut['productDao'], 'findById').mockResolvedValue(null);

      // Act & Assert
      expect.assertions(2);
      return sut.execute('non-existent-id', {}).catch((error) => {
        expect(error).toBeInstanceOf(ProductNotFoundError);
        expect(findByIdSpy).toHaveBeenCalledWith('non-existent-id');
      });
    });

    it('should call repository edit method with correct product', async() => {
      // Arrange
      const productData = createMock<ProductDto>({
        id: 'product-id',
        type: 'Old Type',
        currentStock: 10,
        suppliers: [{ id: supplierId, companyName: 'Test', fantasyName: 'Test' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest.spyOn(sut['productDao'], 'findById').mockResolvedValue(productData);
      const editSpy = jest.spyOn(sut['productRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute('product-id', { type: 'New Type' });

      // Assert
      expect(editSpy).toHaveBeenCalled();
    });

    it('should throw an error if EAN is duplicate for the same company', async() => {
      // Arrange
      const productData = createMock<ProductDto>({
        id: 'product-id',
        ean: '7891234567890',
        companyId: companyId,
        currentStock: 10,
        suppliers: [{ id: supplierId, companyName: 'Test', fantasyName: 'Test' }],
      });

      const existingProduct = createMock<ProductDto>({
        id: 'another-product-id',
        ean: '7899999999999',
        companyId: companyId,
      });

      jest.spyOn(sut['productDao'], 'findById').mockResolvedValue(productData);
      jest.spyOn(sut['productDao'], 'findByEan').mockResolvedValue(existingProduct);
      const editSpy = jest.spyOn(sut['productRepository'], 'edit').mockResolvedValue();

      // Act & Assert
      expect.assertions(3);
      return sut.execute('product-id', { ean: '7899999999999' }).catch((error) => {
        expect(error).toBeInstanceOf(ProductDuplicateEanError);
        expect(editSpy).not.toHaveBeenCalled();
        expect(sut['productDao'].findByEan).toHaveBeenCalledWith('7899999999999', companyId);
      });
    });

    it('should not check for duplicate EAN if EAN is not being changed', async() => {
      // Arrange
      const productData = createMock<ProductDto>({
        id: 'product-id',
        ean: '7891234567890',
        companyId: companyId,
        currentStock: 10,
        suppliers: [{ id: supplierId, companyName: 'Test', fantasyName: 'Test' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(sut['productDao'], 'findById').mockResolvedValue(productData);
      const findByEanSpy = jest.spyOn(sut['productDao'], 'findByEan');
      jest.spyOn(sut['productRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute('product-id', { type: 'New Type' });

      // Assert
      expect(findByEanSpy).not.toHaveBeenCalled();
    });

    it('should preserve currentStock when editing', async() => {
      // Arrange
      const productData = createMock<ProductDto>({
        id: 'product-id',
        currentStock: 50,
        suppliers: [{ id: supplierId, companyName: 'Test', fantasyName: 'Test' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(sut['productDao'], 'findById').mockResolvedValue(productData);
      const editSpy = jest.spyOn(sut['productRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute('product-id', { type: 'New Type', minimumStock: 100 });

      // Assert
      expect(editSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            currentStock: 50,
          }),
        }),
      );
    });

    it('should use existing supplierIds when not provided in data', async() => {
      // Arrange
      const productData = createMock<ProductDto>({
        id: 'product-id',
        currentStock: 10,
        suppliers: [
          { id: supplierId, companyName: 'Test', fantasyName: 'Test' },
          { id: supplierId2, companyName: 'Test2', fantasyName: 'Test2' },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(sut['productDao'], 'findById').mockResolvedValue(productData);
      const editSpy = jest.spyOn(sut['productRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute('product-id', { type: 'New Type' });

      // Assert
      expect(editSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            supplierIds: [supplierId, supplierId2],
          }),
        }),
      );
    });

    it('should return success message', async() => {
      // Arrange
      const productData = createMock<ProductDto>({
        id: 'product-id',
        currentStock: 10,
        suppliers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(sut['productDao'], 'findById').mockResolvedValue(productData);
      jest.spyOn(sut['productRepository'], 'edit').mockResolvedValue();

      // Act
      const result = await sut.execute('product-id', { type: 'New Type' });

      // Assert
      expect(result).toEqual({ message: 'Produto atualizado com sucesso!' });
    });
  });

  describe('integration tests', () => {
    it('should throw an error if product is not found', async() => {
      // Act & Assert
      expect.assertions(1);
      return sut.execute('non-existent-id', {}).catch((error) => {
        expect(error).toBeInstanceOf(ProductNotFoundError);
      });
    });

    it('should update product type', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const updateData: EditProductInputDto = { type: 'Novo Tipo' };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.type).toBe('Novo Tipo');
    });

    it('should update product description', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const updateData: EditProductInputDto = { description: 'Nova Descrição' };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.description).toBe('Nova Descrição');
    });

    it('should update product ean', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const updateData: EditProductInputDto = { ean: '9999999999999' };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.ean).toBe('9999999999999');
    });

    it('should throw an error if EAN is duplicate for the same company', async() => {
      // Arrange
      await createProduct.execute({
        ...data,
        ean: '7891111111111',
      });

      const product2 = await createProduct.execute({
        ...data,
        ean: '7892222222222',
      });

      const updateData: EditProductInputDto = { ean: '7891111111111' };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(product2.id, updateData).catch((error) => {
        expect(error).toBeInstanceOf(ProductDuplicateEanError);
      });
    });

    it('should allow same EAN for different companies when editing', async() => {
      // Arrange
      const company2Id = (await createCompany.execute({
        name: 'Second Company',
        fantasyName: 'Second Fantasy',
        document: '17.828.903/0001-68',
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
        cnpj: '06.371.907/0001-43',
        ie: '987654321',
        group: 'Grupo Teste 3',
        type: 'Nacional',
        companyName: 'Supplier Company 3',
        fantasyName: 'Supplier Fantasy 3',
        representative: 'Representante Teste 3',
        companyIds: [company2Id],
      })).id;

      const productCompany1 = await createProduct.execute({
        ...data,
        companyId: companyId,
        ean: '7899888777666',
      });

      const productCompany2 = await createProduct.execute({
        ...data,
        companyId: company2Id,
        supplierIds: [supplier2Id],
        ean: '7899000000000',
      });

      const updateData: EditProductInputDto = { ean: '7899888777666' }; // Same EAN as company 1

      // Act
      await sut.execute(productCompany2.id, updateData);

      // Assert
      const updatedProduct1 = await findProductById.execute(productCompany1.id);
      const updatedProduct2 = await findProductById.execute(productCompany2.id);

      expect(updatedProduct1.ean).toBe('7899888777666');
      expect(updatedProduct2.ean).toBe('7899888777666');
      expect(updatedProduct1.companyId).toBe(companyId);
      expect(updatedProduct2.companyId).toBe(company2Id);
    });

    it('should not throw error when updating to same EAN', async() => {
      // Arrange
      const product = await createProduct.execute({
        ...data,
        ean: '7891234567890',
      });

      const updateData: EditProductInputDto = {
        ean: '7891234567890', // Same EAN
        type: 'Novo Tipo',
      };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.ean).toBe('7891234567890');
      expect(updatedProduct.type).toBe('Novo Tipo');
    });

    it('should not alter currentStock when editing product', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const originalProduct = await findProductById.execute(product.id);
      const originalStock = originalProduct.currentStock;

      const updateData: EditProductInputDto = {
        type: 'Novo Tipo',
        minimumStock: 100,
        maximumStock: 500,
      };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.currentStock).toBe(originalStock);
    });

    it('should update product suppliers', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const updateData: EditProductInputDto = { supplierIds: [supplierId2] };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.suppliers).toHaveLength(1);
      expect(updatedProduct.suppliers[0].id).toBe(supplierId2);
    });

    it('should keep suppliers unchanged when supplierIds is not provided', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const updateData: EditProductInputDto = { type: 'Novo Tipo' };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.suppliers).toHaveLength(1);
      expect(updatedProduct.suppliers[0].id).toBe(supplierId);
    });

    it('should update multiple fields at once', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const updateData: EditProductInputDto = {
        type: 'Novo Tipo',
        description: 'Nova Descrição',
        brand: 'Nova Marca',
        unitPriceInCents: 5000,
        supplierIds: [supplierId2],
      };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.type).toBe('Novo Tipo');
      expect(updatedProduct.description).toBe('Nova Descrição');
      expect(updatedProduct.brand).toBe('Nova Marca');
      expect(updatedProduct.unitPriceInCents).toBe(5000);
      expect(updatedProduct.suppliers).toHaveLength(1);
      expect(updatedProduct.suppliers[0].id).toBe(supplierId2);
    });

    it('should update product with null optional fields', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const updateData: EditProductInputDto = {
        complement: null,
        additionalInfo: null,
      };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.complement).toBeNull();
      expect(updatedProduct.additionalInfo).toBeNull();
    });

    it('should update product images', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const newImages = [
        'https://example.com/new1.jpg',
        'https://example.com/new2.jpg',
      ];
      const updateData: EditProductInputDto = { images: newImages };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.images).toEqual(newImages);
    });

    it('should update product with decimal values', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const updateData: EditProductInputDto = {
        weightInKg: 12.75,
        heightInCm: 25.5,
        lengthInCm: 38.25,
        widthInCm: 15.125,
        exchangeRate: 5.47,
      };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.weightInKg).toBe(12.75);
      expect(updatedProduct.heightInCm).toBe(25.5);
      expect(updatedProduct.lengthInCm).toBe(38.25);
      expect(updatedProduct.widthInCm).toBe(15.125);
      expect(updatedProduct.exchangeRate).toBe(5.47);
    });

    it('should update product currency', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const updateData: EditProductInputDto = {
        currency: 'USD',
        exchangeRate: 5.5,
      };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.currency).toBe('USD');
      expect(updatedProduct.exchangeRate).toBe(5.5);
    });

    it('should return success message', async() => {
      // Arrange
      const product = await createProduct.execute(data);

      // Act
      const result = await sut.execute(product.id, { type: 'Novo Tipo' });

      // Assert
      expect(result.message).toBe('Produto atualizado com sucesso!');
    });
  });
});
