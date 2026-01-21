import { Test, TestingModule } from '@nestjs/testing';
import { CreateCompany } from 'src/app/company/application/usecases/create-company/create-company.service';
import { CompanyNotFoundError } from 'src/app/company/domain/errors/company-not-found.error';
import { ProductModule } from 'src/app/product/product.module';
import { CreateSupplier } from 'src/app/supplier/application/usecases/create-supplier/create-supplier.service';
import { SupplierModule } from 'src/app/supplier/supplier.module';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';
import { ProductDto } from '../../dtos/product.dto';
import { CreateProduct } from '../create-product/create-product.service';
import { CreateProductInputDto } from '../create-product/dtos/create-product.dto';
import { FindAllProductQueryDto } from './dtos/find-all-product.dto';
import { FindAllProduct } from './find-all-product.service';

describe('FindAllProduct', () => {
  let sut: FindAllProduct;
  let prisma: PrismaService;
  let createProduct: CreateProduct;
  let createCompany: CreateCompany;
  let createSupplier: CreateSupplier;
  let companyId: string;
  let companyId2: string;
  let supplierId: string;
  let supplierId2: string;
  let baseProductData: CreateProductInputDto;
  let createdProductIds: string[];

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ProductModule,
        SupplierModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindAllProduct);
    prisma = module.get(PrismaService);
    createProduct = module.get(CreateProduct);
    createCompany = module.get(CreateCompany);
    createSupplier = module.get(CreateSupplier);

    await prisma.product.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.company.deleteMany();

    // Create test companies
    companyId = (await createCompany.execute({
      name: 'Test Company 1',
      fantasyName: 'Company 1',
      document: '61067756000142',
      ie: '111111111',
      zipCode: '12345678',
      street: 'Test Street 1',
      number: '100',
      neighborhood: 'District 1',
      city: 'City 1',
      state: 'C1',
      phone01: '1111111111',
      cellphone: null,
      phone02: null,
      email01: 'company1@test.com',
      email02: null,
      complement: null,
      reference: null,
    })).id;

    companyId2 = (await createCompany.execute({
      name: 'Test Company 2',
      fantasyName: 'Company 2',
      document: '23211777000109',
      ie: '222222222',
      zipCode: '87654321',
      street: 'Test Street 2',
      number: '200',
      neighborhood: 'District 2',
      city: 'City 2',
      state: 'C2',
      phone01: '2222222222',
      cellphone: null,
      phone02: null,
      email01: 'company2@test.com',
      email02: null,
      complement: null,
      reference: null,
    })).id;

    // Create test suppliers
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
      cnpj: '46735327000102',
      ie: '987654321',
      group: 'Grupo Teste 2',
      type: 'Internacional',
      companyName: 'Supplier Company 2',
      fantasyName: 'Supplier Fantasy 2',
      representative: 'Representante Teste 2',
      companyIds: [companyId],
    })).id;

    baseProductData = {
      companyId,
      type: 'Produto Tipo',
      group01: 'Grupo 01',
      group02: 'Grupo 02',
      description: 'Descrição do produto teste',
      complement: null,
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
      additionalInfo: null,
      supplierIds: [],
      images: [],
    };

    // Create diverse test products
    createdProductIds = [];

    // Product 1: Electronics - Type A
    const product1 = await createProduct.execute({
      ...baseProductData,
      type: 'Electronics',
      group01: 'Computers',
      group02: 'Laptops',
      description: 'High-end Laptop for Gaming',
      manufacturerCode: 'ELEC001',
      brand: 'TechBrand',
      ncm: '84713012',
      ean: '7891234567001',
      supplierIds: [supplierId],
    });
    createdProductIds.push(product1.id);

    // Product 2: Electronics - Type B
    const product2 = await createProduct.execute({
      ...baseProductData,
      type: 'Electronics',
      group01: 'Computers',
      group02: 'Desktops',
      description: 'Office Desktop Computer',
      manufacturerCode: 'ELEC002',
      brand: 'OfficeBrand',
      ncm: '84713012',
      ean: '7891234567002',
      supplierIds: [supplierId],
    });
    createdProductIds.push(product2.id);

    // Product 3: Furniture - Type A
    const product3 = await createProduct.execute({
      ...baseProductData,
      type: 'Furniture',
      group01: 'Office',
      group02: 'Chairs',
      description: 'Ergonomic Office Chair',
      manufacturerCode: 'FURN001',
      brand: 'ComfortBrand',
      ncm: '94013000',
      ean: '7891234567003',
      supplierIds: [supplierId2],
    });
    createdProductIds.push(product3.id);

    // Product 4: Furniture - Type B
    const product4 = await createProduct.execute({
      ...baseProductData,
      type: 'Furniture',
      group01: 'Office',
      group02: 'Desks',
      description: 'Standing Desk',
      manufacturerCode: 'FURN002',
      brand: 'ErgoBrand',
      ncm: '94033010',
      ean: '7891234567004',
      supplierIds: [supplierId, supplierId2],
    });
    createdProductIds.push(product4.id);

    // Product 5: Supplies - Type A
    const product5 = await createProduct.execute({
      ...baseProductData,
      type: 'Supplies',
      group01: 'Paper',
      group02: 'A4',
      description: 'Premium A4 Paper Pack',
      manufacturerCode: 'SUPP001',
      brand: 'PaperBrand',
      ncm: '48023000',
      ean: '7891234567005',
      supplierIds: [],
    });
    createdProductIds.push(product5.id);

    // Product 6: Supplies - Type B
    const product6 = await createProduct.execute({
      ...baseProductData,
      type: 'Supplies',
      group01: 'Paper',
      group02: 'Envelopes',
      description: 'Standard Business Envelopes',
      manufacturerCode: 'SUPP002',
      brand: 'EnvBrand',
      ncm: '48209000',
      ean: '7891234567006',
      supplierIds: [],
    });
    createdProductIds.push(product6.id);
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
    it('should not validate company when companyId is not provided', async() => {
      // Arrange
      const queries: FindAllProductQueryDto = {};
      const findAllSpy = jest.spyOn(sut['productDao'], 'findAll').mockResolvedValue([[], 0]);
      const findCompanySpy = jest.spyOn(sut['findCompanyById'], 'execute');

      // Act
      await sut.execute(queries);

      // Assert
      expect(findCompanySpy).not.toHaveBeenCalled();
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });

    it('should throw an error if company does not exist', async() => {
      // Arrange
      const queries: FindAllProductQueryDto = {
        companyId: 'non-existent-company-id',
      };
      const findAllSpy = jest.spyOn(sut['productDao'], 'findAll').mockResolvedValue([[], 0]);

      // Act & Assert
      expect.assertions(2);
      return sut.execute(queries).catch((error) => {
        expect(error).toBeInstanceOf(CompanyNotFoundError);
        expect(findAllSpy).not.toHaveBeenCalled();
      });
    });

    it('should call productDao with correct parameters', async() => {
      // Arrange
      const queries: FindAllProductQueryDto = {
        companyId,
        page: 1,
        size: 10,
      };
      const findAllSpy = jest.spyOn(sut['productDao'], 'findAll').mockResolvedValue([[], 0]);

      // Act
      await sut.execute(queries);

      // Assert
      expect(findAllSpy).toHaveBeenCalledWith(queries);
    });

    it('should return a Pagination object with correct structure', async() => {
      // Arrange
      const mockData: ProductDto[] = [{ id: 'test-id' } as ProductDto];
      jest.spyOn(sut['productDao'], 'findAll').mockResolvedValue([mockData, 1]);

      // Act
      const result = await sut.execute({ companyId });

      // Assert
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('currentPage');
      expect(result).toHaveProperty('itemsPerPage');
      expect(result).toHaveProperty('totalItems');
      expect(result).toHaveProperty('totalPages');
    });
  });

  describe('integration tests - Basic functionality', () => {
    it('should return products across companies when companyId is not provided', async() => {
      // Arrange
      const product = await createProduct.execute({
        ...baseProductData,
        companyId: companyId2,
        description: 'Company 2 Product',
        ean: '7891234567999',
        manufacturerCode: 'COMP2001',
      });

      // Act
      const result = await sut.execute({});

      // Assert
      expect(result.totalItems).toBe(7);
      const returnedIds = result.data.map(p => p.id);
      expect(returnedIds).toContain(product.id);
    });

    it('should throw an error if company does not exist', async() => {
      // Arrange
      const queries: FindAllProductQueryDto = {
        companyId: 'non-existent-company-id',
      };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(queries).catch((error) => {
        expect(error).toBeInstanceOf(CompanyNotFoundError);
      });
    });

    it('should return an empty result when no products exist for company', async() => {
      // Act
      const result = await sut.execute({ companyId: companyId2 });

      // Assert
      expect(result).toEqual<IPagination<ProductDto>>({
        data: [],
        currentPage: 1,
        itemsPerPage: 0,
        totalItems: 0,
        totalPages: 0,
      });
    });

    it('should return all products when no filters are provided', async() => {
      // Act
      const result = await sut.execute({ companyId });

      // Assert
      expect(result.totalItems).toBe(6);
      expect(result.data).toHaveLength(6);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.itemsPerPage).toBe(6);

      // Verify all created products are returned
      const returnedIds = result.data.map(product => product.id).sort();
      const expectedIds = [...createdProductIds].sort();
      expect(returnedIds).toEqual(expectedIds);
    });

    it('should handle pagination correctly', async() => {
      // Act
      const result = await sut.execute({ companyId, page: 2, size: 2 });

      // Assert
      expect(result.totalItems).toBe(6);
      expect(result.data).toHaveLength(2);
      expect(result.currentPage).toBe(2);
      expect(result.totalPages).toBe(3);
      expect(result.itemsPerPage).toBe(2);
    });

    it('should return correct dto structure', async() => {
      // Act
      const result = await sut.execute({ companyId });

      // Assert
      const product = result.data[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('companyId');
      expect(product).toHaveProperty('type');
      expect(product).toHaveProperty('group01');
      expect(product).toHaveProperty('group02');
      expect(product).toHaveProperty('description');
      expect(product).toHaveProperty('complement');
      expect(product).toHaveProperty('manufacturerCode');
      expect(product).toHaveProperty('brand');
      expect(product).toHaveProperty('measureUnit');
      expect(product).toHaveProperty('ncm');
      expect(product).toHaveProperty('economicBatch');
      expect(product).toHaveProperty('minimumStock');
      expect(product).toHaveProperty('maximumStock');
      expect(product).toHaveProperty('currentStock');
      expect(product).toHaveProperty('warrantyDays');
      expect(product).toHaveProperty('weightInKg');
      expect(product).toHaveProperty('heightInCm');
      expect(product).toHaveProperty('lengthInCm');
      expect(product).toHaveProperty('widthInCm');
      expect(product).toHaveProperty('markup');
      expect(product).toHaveProperty('marginB');
      expect(product).toHaveProperty('currency');
      expect(product).toHaveProperty('exchangeRate');
      expect(product).toHaveProperty('unitCostInCents');
      expect(product).toHaveProperty('unitPriceInCents');
      expect(product).toHaveProperty('ean');
      expect(product).toHaveProperty('additionalInfo');
      expect(product).toHaveProperty('images');
      expect(product).toHaveProperty('suppliers');
      expect(product).toHaveProperty('createdAt');
      expect(product).toHaveProperty('updatedAt');
    });
  });

  describe('integration tests - Individual filter tests', () => {
    it('should filter by type - exact match', async() => {
      // Act
      const result = await sut.execute({ companyId, type: 'Electronics' });

      // Assert
      expect(result.totalItems).toBe(2);
      expect(result.data).toHaveLength(2);
      result.data.forEach(product => {
        expect(product.type).toBe('Electronics');
      });
    });

    it('should filter by type - partial match', async() => {
      // Act
      const result = await sut.execute({ companyId, type: 'Electro' });

      // Assert
      expect(result.totalItems).toBe(2);
      result.data.forEach(product => {
        expect(product.type).toContain('Electro');
      });
    });

    it('should filter by group01 - exact match', async() => {
      // Act
      const result = await sut.execute({ companyId, group01: 'Computers' });

      // Assert
      expect(result.totalItems).toBe(2);
      result.data.forEach(product => {
        expect(product.group01).toBe('Computers');
      });
    });

    it('should filter by group02 - exact match', async() => {
      // Act
      const result = await sut.execute({ companyId, group02: 'Laptops' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].group02).toBe('Laptops');
    });

    it('should filter by description - partial match', async() => {
      // Act
      const result = await sut.execute({ companyId, description: 'Laptop' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].description).toContain('Laptop');
    });

    it('should filter by manufacturerCode - exact match', async() => {
      // Act
      const result = await sut.execute({ companyId, manufacturerCode: 'ELEC001' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].manufacturerCode).toBe('ELEC001');
    });

    it('should filter by brand - exact match', async() => {
      // Act
      const result = await sut.execute({ companyId, brand: 'TechBrand' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].brand).toBe('TechBrand');
    });

    it('should filter by ncm - exact match', async() => {
      // Act
      const result = await sut.execute({ companyId, ncm: '84713012' });

      // Assert
      expect(result.totalItems).toBe(2);
      result.data.forEach(product => {
        expect(product.ncm).toBe('84713012');
      });
    });

    it('should filter by ean - exact match', async() => {
      // Act
      const result = await sut.execute({ companyId, ean: '7891234567001' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].ean).toBe('7891234567001');
    });

    it('should filter by ean - partial match', async() => {
      // Act
      const result = await sut.execute({ companyId, ean: '789123456700' });

      // Assert
      expect(result.totalItems).toBe(6);
      result.data.forEach(product => {
        expect(product.ean).toContain('789123456700');
      });
    });
  });

  describe('integration tests - Case insensitive filters', () => {
    it('should handle case insensitive search for type', async() => {
      // Act
      const result = await sut.execute({ companyId, type: 'ELECTRONICS' });

      // Assert
      expect(result.totalItems).toBe(2);
      result.data.forEach(product => {
        expect(product.type.toLowerCase()).toBe('electronics');
      });
    });

    it('should handle case insensitive search for description', async() => {
      // Act
      const result = await sut.execute({ companyId, description: 'LAPTOP' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].description.toLowerCase()).toContain('laptop');
    });

    it('should handle case insensitive search for brand', async() => {
      // Act
      const result = await sut.execute({ companyId, brand: 'techbrand' });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].brand.toLowerCase()).toBe('techbrand');
    });
  });

  describe('integration tests - Combined filters', () => {
    it('should filter by type AND group01', async() => {
      // Act
      const result = await sut.execute({
        companyId,
        type: 'Electronics',
        group01: 'Computers',
      });

      // Assert
      expect(result.totalItems).toBe(2);
      result.data.forEach(product => {
        expect(product.type).toBe('Electronics');
        expect(product.group01).toBe('Computers');
      });
    });

    it('should filter by type AND group01 AND group02', async() => {
      // Act
      const result = await sut.execute({
        companyId,
        type: 'Electronics',
        group01: 'Computers',
        group02: 'Laptops',
      });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].type).toBe('Electronics');
      expect(result.data[0].group01).toBe('Computers');
      expect(result.data[0].group02).toBe('Laptops');
    });

    it('should filter by description AND brand', async() => {
      // Act
      const result = await sut.execute({
        companyId,
        description: 'Office',
        brand: 'OfficeBrand',
      });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].description).toContain('Office');
      expect(result.data[0].brand).toBe('OfficeBrand');
    });

    it('should return empty when filters do not match any product', async() => {
      // Act
      const result = await sut.execute({
        companyId,
        type: 'Electronics',
        brand: 'NonExistentBrand',
      });

      // Assert
      expect(result.totalItems).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it('should filter by manufacturerCode AND ncm', async() => {
      // Act
      const result = await sut.execute({
        companyId,
        manufacturerCode: 'ELEC001',
        ncm: '84713012',
      });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].manufacturerCode).toBe('ELEC001');
      expect(result.data[0].ncm).toBe('84713012');
    });
  });

  describe('integration tests - Pagination with filters', () => {
    it('should combine pagination with type filter', async() => {
      // Act
      const result = await sut.execute({
        companyId,
        type: 'Supplies',
        page: 1,
        size: 1,
      });

      // Assert
      expect(result.totalItems).toBe(2);
      expect(result.data).toHaveLength(1);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(2);
      expect(result.itemsPerPage).toBe(1);
    });

    it('should combine pagination with multiple filters', async() => {
      // Act
      const result = await sut.execute({
        companyId,
        type: 'Furniture',
        group01: 'Office',
        page: 1,
        size: 1,
      });

      // Assert
      expect(result.totalItems).toBe(2);
      expect(result.data).toHaveLength(1);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(2);
    });

    it('should handle pagination beyond available results', async() => {
      // Act
      const result = await sut.execute({
        companyId,
        type: 'Electronics',
        page: 3,
        size: 2,
      });

      // Assert
      expect(result.totalItems).toBe(2);
      expect(result.data).toHaveLength(0);
      expect(result.currentPage).toBe(3);
    });
  });

  describe('integration tests - Edge cases', () => {
    it('should return empty result when filtering by non-existent value', async() => {
      // Act
      const result = await sut.execute({
        companyId,
        type: 'NonExistentType',
      });

      // Assert
      expect(result.totalItems).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it('should handle empty string filters', async() => {
      // Act
      const result = await sut.execute({
        companyId,
        type: '',
        description: '',
      });

      // Assert
      expect(result.totalItems).toBe(6);
      expect(result.data).toHaveLength(6);
    });

    it('should handle undefined filters mixed with valid ones', async() => {
      // Act
      const result = await sut.execute({
        companyId,
        type: 'Electronics',
        description: undefined,
        brand: undefined,
      });

      // Assert
      expect(result.totalItems).toBe(2);
      result.data.forEach(product => {
        expect(product.type).toBe('Electronics');
      });
    });

    it('should handle partial matches correctly', async() => {
      // Act
      const result = await sut.execute({
        companyId,
        description: 'Paper',
      });

      // Assert
      expect(result.totalItems).toBe(1);
      result.data.forEach(product => {
        expect(product.description).toContain('Paper');
      });
    });
  });

  describe('integration tests - Supplier associations', () => {
    it('should return products with suppliers array populated', async() => {
      // Act
      const result = await sut.execute({
        companyId,
        type: 'Electronics',
      });

      // Assert
      expect(result.totalItems).toBe(2);
      result.data.forEach(product => {
        expect(product.suppliers).toHaveLength(1);
        expect(product.suppliers[0].id).toBe(supplierId);
      });
    });

    it('should return products with multiple suppliers', async() => {
      // Act
      const result = await sut.execute({
        companyId,
        manufacturerCode: 'FURN002',
      });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].suppliers).toHaveLength(2);
      const supplierIds = result.data[0].suppliers.map(s => s.id);
      expect(supplierIds).toContain(supplierId);
      expect(supplierIds).toContain(supplierId2);
    });

    it('should return products with empty suppliers array', async() => {
      // Act
      const result = await sut.execute({
        companyId,
        type: 'Supplies',
      });

      // Assert
      expect(result.totalItems).toBe(2);
      result.data.forEach(product => {
        expect(product.suppliers).toHaveLength(0);
      });
    });

    it('should verify supplier dto structure', async() => {
      // Act
      const result = await sut.execute({
        companyId,
        manufacturerCode: 'ELEC001',
      });

      // Assert
      expect(result.totalItems).toBe(1);
      expect(result.data[0].suppliers[0]).toHaveProperty('id');
      expect(result.data[0].suppliers[0]).toHaveProperty('companyName');
      expect(result.data[0].suppliers[0]).toHaveProperty('fantasyName');
    });
  });

  describe('integration tests - Ordering', () => {
    it('should return products ordered by description ascending', async() => {
      // Act
      const result = await sut.execute({ companyId });

      // Assert
      const descriptions = result.data.map(p => p.description);
      const sortedDescriptions = [...descriptions].sort((a, b) => a.localeCompare(b));
      expect(descriptions).toEqual(sortedDescriptions);
    });
  });
});
