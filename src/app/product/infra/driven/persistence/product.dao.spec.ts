import { Test } from '@nestjs/testing';
import { Company, Supplier } from '@prisma/client';
import { ProductPersistenceModule } from 'src/app/product/application/persistence/product-persistence.module';
import { FindAllProductQueryDto } from 'src/app/product/application/usecases/find-all-product/dtos/find-all-product.dto';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { ProductDaoAdapterPrisma } from './product.dao';

describe('ProductDaoAdapterPrisma', () => {
  let sut: ProductDaoAdapterPrisma;
  let prisma: PrismaService;
  let company01: Company;
  let company02: Company;
  let supplier01: Supplier;
  let supplier02: Supplier;

  beforeEach(async() => {
    const module = await Test.createTestingModule({
      imports: [
        ProductPersistenceModule,
        ConfigModule,
      ],
      providers: [
        ProductDaoAdapterPrisma,
      ],
    }).compile();

    sut = module.get(ProductDaoAdapterPrisma);
    prisma = module.get(PrismaService);

    await prisma.truncate();

    company01 = await prisma.company.create({
      data: {
        name: 'Company 01',
        fantasyName: 'Company 01 Fantasy',
        document: '11222333000181',
        ie: 'ie teste',
        zipCode: 'zipCode teste',
        street: 'street teste',
        number: 'number teste',
        neighborhood: 'neighborhood teste',
        city: 'city teste',
        state: 'state teste',
        phone01: 'phone01 teste',
        email01: 'email01 teste',
        active: true,
      },
    });

    company02 = await prisma.company.create({
      data: {
        name: 'Company 02',
        fantasyName: 'Company 02 Fantasy',
        document: '22333444000105',
        ie: 'ie teste 02',
        zipCode: 'zipCode teste 02',
        street: 'street teste 02',
        number: 'number teste 02',
        neighborhood: 'neighborhood teste 02',
        city: 'city teste 02',
        state: 'state teste 02',
        phone01: 'phone01 teste 02',
        email01: 'email01 teste 02',
        active: true,
      },
    });

    supplier01 = await prisma.supplier.create({
      data: {
        id: 'supplier-01',
        cnpj: '33444555000172',
        ie: '111222333',
        group: 'Group A',
        type: 'Type A',
        companyName: 'Supplier Company 01',
        fantasyName: 'Supplier Fantasy 01',
        representative: 'Rep 01',
        active: true,
        companies: { connect: { id: company01.id } },
      },
    });

    supplier02 = await prisma.supplier.create({
      data: {
        id: 'supplier-02',
        cnpj: '44555666000163',
        ie: '222333444',
        group: 'Group B',
        type: 'Type B',
        companyName: 'Supplier Company 02',
        fantasyName: 'Supplier Fantasy 02',
        representative: 'Rep 02',
        active: true,
        companies: { connect: { id: company01.id } },
      },
    });
  });

  afterEach(async() => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('findAll', () => {
    beforeEach(async() => {
      await prisma.product.create({
        data: {
          id: 'product-1',
          type: 'Eletrônico',
          group01: 'Informática',
          group02: 'Computadores',
          description: 'Notebook Dell Inspiron',
          complement: 'Core i7 16GB',
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
          additionalInfo: 'Informação adicional',
          images: ['https://example.com/image1.jpg'],
          companyId: company01.id,
          suppliers: { connect: { id: supplier01.id } },
        },
      });

      await prisma.product.create({
        data: {
          id: 'product-2',
          type: 'Eletrônico',
          group01: 'Informática',
          group02: 'Periféricos',
          description: 'Mouse Logitech MX Master',
          complement: 'Wireless',
          manufacturerCode: 'LOG-002',
          brand: 'Logitech',
          measureUnit: 'UN',
          ncm: '84716060',
          economicBatch: 'BATCH002',
          minimumStock: 10,
          maximumStock: 100,
          currentStock: 45,
          warrantyDays: 180,
          weightInKg: 0.2,
          heightInCm: 5.0,
          lengthInCm: 12.0,
          widthInCm: 7.0,
          markup: 40,
          marginB: 25,
          currency: 'BRL',
          exchangeRate: 1.0,
          unitCostInCents: 30000,
          unitPriceInCents: 45000,
          ean: '7891234567891',
          additionalInfo: null,
          images: ['https://example.com/image2.jpg', 'https://example.com/image3.jpg'],
          companyId: company01.id,
          suppliers: { connect: [{ id: supplier01.id }, { id: supplier02.id }] },
        },
      });

      await prisma.product.create({
        data: {
          id: 'product-3',
          type: 'Móvel',
          group01: 'Escritório',
          group02: 'Mesas',
          description: 'Mesa de Escritório',
          complement: 'Madeira MDF',
          manufacturerCode: 'MOV-003',
          brand: 'Tok&Stok',
          measureUnit: 'UN',
          ncm: '94033000',
          economicBatch: 'BATCH003',
          minimumStock: 2,
          maximumStock: 20,
          currentStock: 8,
          warrantyDays: 90,
          weightInKg: 25.0,
          heightInCm: 75.0,
          lengthInCm: 120.0,
          widthInCm: 60.0,
          markup: 50,
          marginB: 30,
          currency: 'BRL',
          exchangeRate: 1.0,
          unitCostInCents: 50000,
          unitPriceInCents: 75000,
          ean: '7891234567892',
          additionalInfo: 'Cor: Marrom',
          images: [],
          companyId: company01.id,
          suppliers: { connect: { id: supplier02.id } },
        },
      });

      await prisma.product.create({
        data: {
          id: 'product-4',
          type: 'Eletrônico',
          group01: 'Informática',
          group02: 'Computadores',
          description: 'Desktop HP ProDesk',
          complement: 'Core i5 8GB',
          manufacturerCode: 'HP-004',
          brand: 'HP',
          measureUnit: 'UN',
          ncm: '84713012',
          economicBatch: 'BATCH004',
          minimumStock: 3,
          maximumStock: 30,
          currentStock: 10,
          warrantyDays: 365,
          weightInKg: 8.0,
          heightInCm: 35.0,
          lengthInCm: 40.0,
          widthInCm: 20.0,
          markup: 35,
          marginB: 22,
          currency: 'USD',
          exchangeRate: 5.0,
          unitCostInCents: 250000,
          unitPriceInCents: 350000,
          ean: '7891234567893',
          additionalInfo: null,
          images: ['https://example.com/image4.jpg'],
          companyId: company02.id,
          suppliers: { connect: { id: supplier01.id } },
        },
      });
    });

    it('should return products filtered by companyId', async() => {
      // Arrange
      const query: FindAllProductQueryDto = { companyId: company01.id };

      // Act
      const [products, total] = await sut.findAll(query);

      // Assert
      expect(total).toBe(3);
      expect(products).toHaveLength(3);
      products.forEach(product => {
        expect(product.companyId).toBe(company01.id);
      });
    });

    it('should order results by description asc', async() => {
      // Arrange
      const query: FindAllProductQueryDto = { companyId: company01.id };

      // Act
      const [products] = await sut.findAll(query);

      // Assert
      expect(products[0].description).toBe('Mesa de Escritório');
      expect(products[1].description).toBe('Mouse Logitech MX Master');
      expect(products[2].description).toBe('Notebook Dell Inspiron');
    });

    describe('filter by type', () => {
      it('should filter by type - exact match', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, type: 'Eletrônico' };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2);
        products.forEach(product => {
          expect(product.type).toBe('Eletrônico');
        });
      });

      it('should filter by type - partial match', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, type: 'Eletr' };

        // Act
        const [, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2);
      });

      it('should filter by type - case insensitive', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, type: 'ELETRÔNICO' };

        // Act
        const [, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2);
      });

      it('should return empty when type does not match', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, type: 'NonExistent' };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(0);
        expect(products).toHaveLength(0);
      });
    });

    describe('filter by group01', () => {
      it('should filter by group01 - exact match', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, group01: 'Informática' };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2);
        products.forEach(product => {
          expect(product.group01).toBe('Informática');
        });
      });

      it('should filter by group01 - partial match', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, group01: 'Inform' };

        // Act
        const [, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2);
      });

      it('should filter by group01 - case insensitive', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, group01: 'INFORMÁTICA' };

        // Act
        const [, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2);
      });
    });

    describe('filter by group02', () => {
      it('should filter by group02 - exact match', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, group02: 'Computadores' };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(products[0].group02).toBe('Computadores');
      });

      it('should filter by group02 - partial match', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, group02: 'Comput' };

        // Act
        const [, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
      });

      it('should filter by group02 - case insensitive', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, group02: 'PERIFÉRICOS' };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(products[0].id).toBe('product-2');
      });
    });

    describe('filter by description', () => {
      it('should filter by description - exact match', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, description: 'Notebook Dell Inspiron' };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(products[0].description).toBe('Notebook Dell Inspiron');
      });

      it('should filter by description - partial match', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, description: 'Dell' };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(products[0].id).toBe('product-1');
      });

      it('should filter by description - case insensitive', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, description: 'MOUSE' };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(products[0].id).toBe('product-2');
      });

      it('should return empty when description does not match', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, description: 'NonExistent' };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(0);
        expect(products).toHaveLength(0);
      });
    });

    describe('filter by manufacturerCode', () => {
      it('should filter by manufacturerCode - exact match', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, manufacturerCode: 'DELL-001' };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(products[0].manufacturerCode).toBe('DELL-001');
      });

      it('should filter by manufacturerCode - partial match', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, manufacturerCode: 'DELL' };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(products[0].id).toBe('product-1');
      });

      it('should filter by manufacturerCode - case insensitive', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, manufacturerCode: 'dell-001' };

        // Act
        const [, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
      });
    });

    describe('filter by brand', () => {
      it('should filter by brand - exact match', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, brand: 'Dell' };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(products[0].brand).toBe('Dell');
      });

      it('should filter by brand - partial match', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, brand: 'Log' };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(products[0].brand).toBe('Logitech');
      });

      it('should filter by brand - case insensitive', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, brand: 'DELL' };

        // Act
        const [, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
      });

      it('should return empty when brand does not match', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, brand: 'NonExistent' };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(0);
        expect(products).toHaveLength(0);
      });
    });

    describe('filter by ncm', () => {
      it('should filter by ncm - exact match', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, ncm: '84713012' };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(products[0].ncm).toBe('84713012');
      });

      it('should filter by ncm - partial match', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, ncm: '8471' };

        // Act
        const [, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2);
      });

      it('should return empty when ncm does not match', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, ncm: '99999999' };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(0);
        expect(products).toHaveLength(0);
      });
    });

    describe('filter by ean', () => {
      it('should filter by ean - exact match', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, ean: '7891234567890' };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(products[0].ean).toBe('7891234567890');
        expect(products[0].id).toBe('product-1');
      });

      it('should filter by ean - partial match', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, ean: '789123456789' };

        // Act
        const [, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3);
      });

      it('should return empty when ean does not match', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, ean: '0000000000000' };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(0);
        expect(products).toHaveLength(0);
      });
    });

    describe('pagination', () => {
      it('should paginate results - first page', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, page: 1, size: 2 };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3);
        expect(products).toHaveLength(2);
      });

      it('should paginate results - second page', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, page: 2, size: 2 };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3);
        expect(products).toHaveLength(1);
      });

      it('should return empty when page exceeds available results', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id, page: 10, size: 10 };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3);
        expect(products).toHaveLength(0);
      });

      it('should return all results when no pagination provided', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3);
        expect(products).toHaveLength(3);
      });
    });

    describe('combined filters', () => {
      it('should filter by type AND group01', async() => {
        // Arrange
        const query: FindAllProductQueryDto = {
          companyId: company01.id,
          type: 'Eletrônico',
          group01: 'Informática',
        };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2);
        products.forEach(product => {
          expect(product.type).toBe('Eletrônico');
          expect(product.group01).toBe('Informática');
        });
      });

      it('should filter by type AND group01 AND group02', async() => {
        // Arrange
        const query: FindAllProductQueryDto = {
          companyId: company01.id,
          type: 'Eletrônico',
          group01: 'Informática',
          group02: 'Computadores',
        };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(products[0].id).toBe('product-1');
      });

      it('should filter by brand AND manufacturerCode', async() => {
        // Arrange
        const query: FindAllProductQueryDto = {
          companyId: company01.id,
          brand: 'Dell',
          manufacturerCode: 'DELL-001',
        };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(products[0].id).toBe('product-1');
      });

      it('should filter by description AND brand', async() => {
        // Arrange
        const query: FindAllProductQueryDto = {
          companyId: company01.id,
          description: 'Mouse',
          brand: 'Logitech',
        };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(products[0].id).toBe('product-2');
      });

      it('should filter by ncm AND ean', async() => {
        // Arrange
        const query: FindAllProductQueryDto = {
          companyId: company01.id,
          ncm: '84713012',
          ean: '7891234567890',
        };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(products[0].id).toBe('product-1');
      });

      it('should return empty when combined filters match no products', async() => {
        // Arrange
        const query: FindAllProductQueryDto = {
          companyId: company01.id,
          type: 'Eletrônico',
          group01: 'Escritório',
        };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(0);
        expect(products).toHaveLength(0);
      });

      it('should combine all filter types', async() => {
        // Arrange
        const query: FindAllProductQueryDto = {
          companyId: company01.id,
          type: 'Eletrônico',
          group01: 'Informática',
          group02: 'Computadores',
          description: 'Notebook',
          manufacturerCode: 'DELL',
          brand: 'Dell',
          ncm: '84713012',
          ean: '7891234567890',
        };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(products[0].id).toBe('product-1');
      });
    });

    describe('pagination with filters', () => {
      it('should paginate filtered results by type', async() => {
        // Arrange
        const query: FindAllProductQueryDto = {
          companyId: company01.id,
          type: 'Eletrônico',
          page: 1,
          size: 1,
        };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2);
        expect(products).toHaveLength(1);
      });

      it('should paginate filtered results by group01', async() => {
        // Arrange
        const query: FindAllProductQueryDto = {
          companyId: company01.id,
          group01: 'Informática',
          page: 1,
          size: 1,
        };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2);
        expect(products).toHaveLength(1);
      });

      it('should return second page of filtered results', async() => {
        // Arrange
        const query: FindAllProductQueryDto = {
          companyId: company01.id,
          type: 'Eletrônico',
          page: 2,
          size: 1,
        };

        // Act
        const [filteredProducts, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(2);
        expect(filteredProducts).toHaveLength(1);
      });

      it('should return empty when page exceeds filtered results', async() => {
        // Arrange
        const query: FindAllProductQueryDto = {
          companyId: company01.id,
          type: 'Móvel',
          page: 2,
          size: 10,
        };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(products).toHaveLength(0);
      });
    });

    describe('edge cases', () => {
      it('should handle empty string filters (return all for company)', async() => {
        // Arrange
        const query: FindAllProductQueryDto = {
          companyId: company01.id,
          type: '',
          brand: '',
        };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3);
        expect(products).toHaveLength(3);
      });

      it('should handle undefined filters', async() => {
        // Arrange
        const query: FindAllProductQueryDto = {
          companyId: company01.id,
          type: undefined,
          group01: undefined,
          brand: undefined,
        };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(3);
        expect(products).toHaveLength(3);
      });

      it('should return products only from specified company', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company02.id };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(1);
        expect(products[0].id).toBe('product-4');
        expect(products[0].companyId).toBe(company02.id);
      });

      it('should return empty for non-existent company', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: 'non-existent-company-id' };

        // Act
        const [products, total] = await sut.findAll(query);

        // Assert
        expect(total).toBe(0);
        expect(products).toHaveLength(0);
      });
    });

    describe('includes suppliers', () => {
      it('should return products with suppliers', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id };

        // Act
        const [products] = await sut.findAll(query);

        // Assert
        const product1 = products.find(p => p.id === 'product-1');
        expect(product1?.suppliers).toHaveLength(1);
        expect(product1?.suppliers[0].id).toBe('supplier-01');

        const product2 = products.find(p => p.id === 'product-2');
        expect(product2?.suppliers).toHaveLength(2);
        const supplierIds = product2?.suppliers.map(s => s.id).sort();
        expect(supplierIds).toEqual(['supplier-01', 'supplier-02']);
      });

      it('should include supplier companyName and fantasyName', async() => {
        // Arrange
        const query: FindAllProductQueryDto = { companyId: company01.id };

        // Act
        const [products] = await sut.findAll(query);

        // Assert
        const product1 = products.find(p => p.id === 'product-1');
        expect(product1?.suppliers[0].companyName).toBe('Supplier Company 01');
        expect(product1?.suppliers[0].fantasyName).toBe('Supplier Fantasy 01');
      });
    });
  });

  describe('findById', () => {
    it('should return null when product not found', async() => {
      // Act
      const product = await sut.findById('non-existent-id');

      // Assert
      expect(product).toBeNull();
    });

    it('should return the correct product when found', async() => {
      // Arrange
      await prisma.product.create({
        data: {
          id: 'test-product-id',
          type: 'Eletrônico',
          group01: 'Informática',
          group02: 'Computadores',
          description: 'Test Product',
          complement: 'Test complement',
          manufacturerCode: 'TEST-001',
          brand: 'TestBrand',
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
          images: ['https://example.com/image.jpg'],
          companyId: company01.id,
          suppliers: { connect: { id: supplier01.id } },
        },
      });

      // Act
      const product = await sut.findById('test-product-id');

      // Assert
      expect(product).not.toBeNull();
      expect(product?.id).toBe('test-product-id');
      expect(product?.description).toBe('Test Product');
      expect(product?.companyId).toBe(company01.id);
      expect(product?.suppliers).toHaveLength(1);
    });

    it('should return product with all fields correctly mapped', async() => {
      // Arrange
      await prisma.product.create({
        data: {
          id: 'full-product-id',
          type: 'Eletrônico',
          group01: 'Informática',
          group02: 'Computadores',
          description: 'Full Product',
          complement: 'Full complement',
          manufacturerCode: 'FULL-001',
          brand: 'FullBrand',
          measureUnit: 'UN',
          ncm: '84713012',
          economicBatch: 'BATCHFULL',
          minimumStock: 10,
          maximumStock: 100,
          currentStock: 50,
          warrantyDays: 180,
          weightInKg: 1.5,
          heightInCm: 10.0,
          lengthInCm: 20.0,
          widthInCm: 15.0,
          markup: 25,
          marginB: 15,
          currency: 'USD',
          exchangeRate: 5.0,
          unitCostInCents: 100000,
          unitPriceInCents: 150000,
          ean: '1234567890123',
          additionalInfo: 'Some additional info',
          images: ['img1.jpg', 'img2.jpg'],
          companyId: company01.id,
        },
      });

      // Act
      const product = await sut.findById('full-product-id');

      // Assert
      expect(product).toMatchObject({
        id: 'full-product-id',
        type: 'Eletrônico',
        group01: 'Informática',
        group02: 'Computadores',
        description: 'Full Product',
        complement: 'Full complement',
        manufacturerCode: 'FULL-001',
        brand: 'FullBrand',
        measureUnit: 'UN',
        ncm: '84713012',
        economicBatch: 'BATCHFULL',
        minimumStock: 10,
        maximumStock: 100,
        currentStock: 50,
        warrantyDays: 180,
        weightInKg: 1.5,
        heightInCm: 10.0,
        lengthInCm: 20.0,
        widthInCm: 15.0,
        markup: 25,
        marginB: 15,
        currency: 'USD',
        exchangeRate: 5.0,
        unitCostInCents: 100000,
        unitPriceInCents: 150000,
        ean: '1234567890123',
        additionalInfo: 'Some additional info',
        images: ['img1.jpg', 'img2.jpg'],
        companyId: company01.id,
      });
    });
  });

  describe('findByEan', () => {
    beforeEach(async() => {
      await prisma.product.create({
        data: {
          id: 'ean-test-product-1',
          type: 'Eletrônico',
          group01: 'Informática',
          group02: 'Computadores',
          description: 'EAN Test Product 1',
          complement: null,
          manufacturerCode: 'EAN-001',
          brand: 'EANBrand',
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
          ean: '1111111111111',
          additionalInfo: null,
          images: [],
          companyId: company01.id,
        },
      });

      await prisma.product.create({
        data: {
          id: 'ean-test-product-2',
          type: 'Eletrônico',
          group01: 'Informática',
          group02: 'Periféricos',
          description: 'EAN Test Product 2',
          complement: null,
          manufacturerCode: 'EAN-002',
          brand: 'EANBrand',
          measureUnit: 'UN',
          ncm: '84716060',
          economicBatch: 'BATCH002',
          minimumStock: 10,
          maximumStock: 100,
          currentStock: 45,
          warrantyDays: 180,
          weightInKg: 0.2,
          heightInCm: 5.0,
          lengthInCm: 12.0,
          widthInCm: 7.0,
          markup: 40,
          marginB: 25,
          currency: 'BRL',
          exchangeRate: 1.0,
          unitCostInCents: 30000,
          unitPriceInCents: 45000,
          ean: '1111111111111',
          additionalInfo: null,
          images: [],
          companyId: company02.id,
        },
      });
    });

    it('should return null when product with ean not found', async() => {
      // Act
      const product = await sut.findByEan('9999999999999', company01.id);

      // Assert
      expect(product).toBeNull();
    });

    it('should return null when ean exists but in different company', async() => {
      // Act
      const product = await sut.findByEan('1111111111111', 'non-existent-company-id');

      // Assert
      expect(product).toBeNull();
    });

    it('should return the correct product when found by ean and companyId', async() => {
      // Act
      const product = await sut.findByEan('1111111111111', company01.id);

      // Assert
      expect(product).not.toBeNull();
      expect(product?.id).toBe('ean-test-product-1');
      expect(product?.ean).toBe('1111111111111');
      expect(product?.companyId).toBe(company01.id);
    });

    it('should find product with same ean in different company', async() => {
      // Act
      const productCompany01 = await sut.findByEan('1111111111111', company01.id);
      const productCompany02 = await sut.findByEan('1111111111111', company02.id);

      // Assert
      expect(productCompany01?.id).toBe('ean-test-product-1');
      expect(productCompany01?.companyId).toBe(company01.id);

      expect(productCompany02?.id).toBe('ean-test-product-2');
      expect(productCompany02?.companyId).toBe(company02.id);
    });
  });
});
