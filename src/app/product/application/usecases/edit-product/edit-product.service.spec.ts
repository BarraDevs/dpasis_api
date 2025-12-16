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
      });
      jest.spyOn(sut['productDao'], 'findById').mockResolvedValue(productData);
      const editSpy = jest.spyOn(sut['productRepository'], 'edit').mockResolvedValue();

      // Act
      await sut.execute('product-id', { type: 'New Type' });

      // Assert
      expect(editSpy).toHaveBeenCalled();
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

    it('should update product group01', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const updateData: EditProductInputDto = { group01: 'Novo Grupo 01' };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.group01).toBe('Novo Grupo 01');
    });

    it('should update product group02', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const updateData: EditProductInputDto = { group02: 'Novo Grupo 02' };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.group02).toBe('Novo Grupo 02');
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

    it('should update product complement', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const updateData: EditProductInputDto = { complement: 'Novo Complemento' };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.complement).toBe('Novo Complemento');
    });

    it('should update product manufacturerCode', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const updateData: EditProductInputDto = { manufacturerCode: 'NEWCODE001' };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.manufacturerCode).toBe('NEWCODE001');
    });

    it('should update product brand', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const updateData: EditProductInputDto = { brand: 'Nova Marca' };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.brand).toBe('Nova Marca');
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

    it('should update product ncm', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const updateData: EditProductInputDto = { ncm: '99999999' };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.ncm).toBe('99999999');
    });

    it('should update product minimumStock and maximumStock', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const updateData: EditProductInputDto = { minimumStock: 5, maximumStock: 50 };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.minimumStock).toBe(5);
      expect(updatedProduct.maximumStock).toBe(50);
    });

    it('should update product price fields', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const updateData: EditProductInputDto = {
        unitCostInCents: 2000,
        unitPriceInCents: 3000,
        markup: 50,
        marginB: 30,
      };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.unitCostInCents).toBe(2000);
      expect(updatedProduct.unitPriceInCents).toBe(3000);
      expect(updatedProduct.markup).toBe(50);
      expect(updatedProduct.marginB).toBe(30);
    });

    it('should update product dimensions', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const updateData: EditProductInputDto = {
        weightInKg: 2.5,
        heightInCm: 20,
        lengthInCm: 30,
        widthInCm: 25,
      };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.weightInKg).toBe(2.5);
      expect(updatedProduct.heightInCm).toBe(20);
      expect(updatedProduct.lengthInCm).toBe(30);
      expect(updatedProduct.widthInCm).toBe(25);
    });

    it('should update product images', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const newImages = [
        'https://example.com/newimage1.jpg',
        'https://example.com/newimage2.jpg',
      ];
      const updateData: EditProductInputDto = { images: newImages };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.images).toEqual(newImages);
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

    it('should add more suppliers to product', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const updateData: EditProductInputDto = { supplierIds: [supplierId, supplierId2] };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.suppliers).toHaveLength(2);
      expect(updatedProduct.suppliers.map(s => s.id)).toContain(supplierId);
      expect(updatedProduct.suppliers.map(s => s.id)).toContain(supplierId2);
    });

    it('should remove all suppliers from product', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const updateData: EditProductInputDto = { supplierIds: [] };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.suppliers).toHaveLength(0);
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
        group01: 'Novo Grupo 01',
        group02: 'Novo Grupo 02',
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
      expect(updatedProduct.group01).toBe('Novo Grupo 01');
      expect(updatedProduct.group02).toBe('Novo Grupo 02');
      expect(updatedProduct.description).toBe('Nova Descrição');
      expect(updatedProduct.brand).toBe('Nova Marca');
      expect(updatedProduct.unitPriceInCents).toBe(5000);
      expect(updatedProduct.suppliers).toHaveLength(1);
      expect(updatedProduct.suppliers[0].id).toBe(supplierId2);
    });

    it('should return success message', async() => {
      // Arrange
      const product = await createProduct.execute(data);

      // Act
      const result = await sut.execute(product.id, { type: 'Novo Tipo' });

      // Assert
      expect(result.message).toBe('Produto atualizado com sucesso!');
    });

    it('should update additionalInfo', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const updateData: EditProductInputDto = { additionalInfo: 'Novas informações adicionais' };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.additionalInfo).toBe('Novas informações adicionais');
    });

    it('should update currency and exchangeRate', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const updateData: EditProductInputDto = { currency: 'USD', exchangeRate: 5.5 };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.currency).toBe('USD');
      expect(updatedProduct.exchangeRate).toBe(5.5);
    });

    it('should update warrantyDays', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const updateData: EditProductInputDto = { warrantyDays: 730 };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.warrantyDays).toBe(730);
    });

    it('should update economicBatch', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const updateData: EditProductInputDto = { economicBatch: 'NEWBATCH001' };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.economicBatch).toBe('NEWBATCH001');
    });

    it('should update measureUnit', async() => {
      // Arrange
      const product = await createProduct.execute(data);
      const updateData: EditProductInputDto = { measureUnit: 'KG' };

      // Act
      await sut.execute(product.id, updateData);

      // Assert
      const updatedProduct = await findProductById.execute(product.id);
      expect(updatedProduct.measureUnit).toBe('KG');
    });
  });
});
